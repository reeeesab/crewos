"use client";

import { useParams } from "next/navigation";
import { Loader2, Activity, TrendingUp, Bug, DollarSign, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc/provider";

function GaugeRing({ value, label, color }: { value: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-sf-border-subtle" strokeWidth="6" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)" className="transition-all duration-700 drop-shadow-[0_0_8px_currentColor]" />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="text-lg font-bold" fill="#F0F4FF" fontSize="22">{value}</text>
      </svg>
      <span className="text-xs font-bold text-sf-text-secondary mt-3 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function HealthPage() {
  const params = useParams();
  const productId = params.productId as string;

  const { data: product, isLoading } = trpc.product.get.useQuery({ id: productId });
  const { data: snapshots } = trpc.revenue.listSnapshots.useQuery({ productId });
  const { data: costs } = trpc.cost.list.useQuery({ productId });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-sf-text-muted" /></div>;
  }

  if (!product) return <div>Product not found</div>;

  const allSnapshots = snapshots || [];
  const allCosts = costs || [];
  const totalCosts = allCosts.reduce((s: any, c: any) => s + c.amount, 0);

  // --- Revenue Health (40%) ---
  let revenueScore = 0;
  // MRR Growth
  if (allSnapshots.length >= 2) {
    const latest = allSnapshots[allSnapshots.length - 1];
    const prev = allSnapshots[allSnapshots.length - 2];
    const growthPct = prev.mrr > 0 ? ((latest.mrr - prev.mrr) / prev.mrr) * 100 : 0;
    if (growthPct > 10) revenueScore += 20;
    else if (growthPct > 5) revenueScore += 15;
    else if (growthPct > 0) revenueScore += 10;
    else revenueScore += 0;
  } else {
    revenueScore += product.mrr > 0 ? 10 : 0;
  }
  // Churn health
  if (product.churnRate <= 2) revenueScore += 20;
  else if (product.churnRate <= 5) revenueScore += 15;
  else if (product.churnRate <= 10) revenueScore += 10;
  else revenueScore += 0;

  // --- Product Health (30%) ---
  let productScore = 0;
  const openBugs = product.issues?.filter((i: any) => i.type === "BUG" && i.status !== "CLOSED").length || product.openBugs || 0;
  if (openBugs === 0) productScore += 15;
  else if (openBugs <= 3) productScore += 10;
  else if (openBugs <= 5) productScore += 5;
  // Feature velocity
  const closedIssues = product.issues?.filter((i: any) => i.status === "CLOSED").length || 0;
  const totalIssues = product.issues?.length || 0;
  const closedPct = totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0;
  if (closedPct > 70) productScore += 15;
  else if (closedPct > 40) productScore += 10;
  else productScore += 5;

  // --- Financial Health (30%) ---
  let financialScore = 0;
  const netMargin = product.mrr - totalCosts;
  const marginPct = product.mrr > 0 ? (netMargin / product.mrr) * 100 : 0;
  if (marginPct > 60) financialScore += 15;
  else if (marginPct > 30) financialScore += 10;
  else if (marginPct > 0) financialScore += 5;
  // Cost efficiency
  if (totalCosts < product.mrr * 0.3) financialScore += 15;
  else if (totalCosts < product.mrr * 0.6) financialScore += 10;
  else financialScore += 5;

  const totalScore = Math.min(100, revenueScore + productScore + financialScore);
  const scoreColor = totalScore >= 75 ? "#22c55e" : totalScore >= 50 ? "#f59e0b" : "#ef4444";

  const factors = [
    { label: "MRR Growth", value: allSnapshots.length >= 2 ? `${((allSnapshots[allSnapshots.length-1].mrr - allSnapshots[allSnapshots.length-2].mrr) / allSnapshots[allSnapshots.length-2].mrr * 100).toFixed(1)}%` : "N/A", good: revenueScore > 15 },
    { label: "Churn Rate", value: `${product.churnRate.toFixed(1)}%`, good: product.churnRate < 5 },
    { label: "Open Bugs", value: openBugs.toString(), good: openBugs <= 3 },
    { label: "Issue Resolution", value: `${closedPct.toFixed(0)}%`, good: closedPct > 50 },
    { label: "Net Margin", value: `${marginPct.toFixed(0)}%`, good: marginPct > 30 },
    { label: "Cost Ratio", value: product.mrr > 0 ? `${(totalCosts / product.mrr * 100).toFixed(0)}%` : "N/A", good: totalCosts < product.mrr * 0.5 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-sf-text-primary">Health Score</h1>
        <p className="text-sm text-sf-text-secondary mt-1">Computed from your live revenue, product, and financial data</p>
      </div>

      {/* Main gauge */}
      <div className="relative overflow-hidden rounded-2xl border border-sf-border-subtle bg-sf-surface p-8 shadow-xl backdrop-blur-xl">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-sf-accent/5 blur-[80px]"></div>
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-14">
          <div className="flex flex-col items-center">
            <svg width="180" height="180" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="68" fill="none" stroke="currentColor" className="text-sf-border-subtle" strokeWidth="10" />
              <circle cx="80" cy="80" r="68" fill="none" stroke={scoreColor} strokeWidth="10"
                strokeDasharray={2 * Math.PI * 68} strokeDashoffset={2 * Math.PI * 68 - (totalScore / 100) * 2 * Math.PI * 68}
                strokeLinecap="round" transform="rotate(-90 80 80)" className="transition-all duration-1000 drop-shadow-[0_0_12px_currentColor]" />
              <text x="80" y="74" textAnchor="middle" dominantBaseline="central" fill="#F0F4FF" fontSize="36" fontWeight="bold">{totalScore}</text>
              <text x="80" y="100" textAnchor="middle" fill="#8892A4" fontSize="11" fontWeight="600">/ 100</text>
            </svg>
            <span className="mt-4 text-sm font-bold uppercase tracking-widest" style={{ color: scoreColor }}>
              {totalScore >= 75 ? "Excellent" : totalScore >= 50 ? "Moderate" : "Needs Attention"}
            </span>
          </div>

          <div className="flex gap-6">
            <GaugeRing value={Math.round(revenueScore / 40 * 100)} label="Revenue" color="#4f6ef7" />
            <GaugeRing value={Math.round(productScore / 30 * 100)} label="Product" color="#22c55e" />
            <GaugeRing value={Math.round(financialScore / 30 * 100)} label="Financial" color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Factors */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {factors.map((f: any) => (
          <div key={f.label} className={`relative overflow-hidden rounded-2xl border bg-sf-surface/50 p-5 shadow-lg backdrop-blur-md transition-all hover:border-sf-border-default ${f.good ? "border-sf-green/20" : "border-sf-red/30"}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-sf-base/50 opacity-50 pointer-events-none"></div>
            <div className="relative z-10 text-[11px] font-bold uppercase tracking-widest text-sf-text-secondary w-full truncate mb-2">{f.label}</div>
            <div className={`relative z-10 text-2xl font-bold tracking-tight ${f.good ? "text-sf-green drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "text-sf-red drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"}`}>{f.value}</div>
            <div className={`relative z-10 text-[10px] font-bold uppercase tracking-wider mt-2 ${f.good ? "text-sf-green/80" : "text-sf-red/80"}`}>
              {f.good ? "✓ Healthy" : "⚠ Attention"}
            </div>
          </div>
        ))}
      </div>

      {/* Score breakdown */}
      <div className="relative overflow-hidden rounded-2xl border border-sf-border-subtle bg-sf-surface p-7 shadow-lg backdrop-blur-xl">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-sf-text-secondary mb-6">Score Breakdown</h2>
        <div className="space-y-5">
          {[
            { label: "Revenue Health", score: revenueScore, max: 40, icon: TrendingUp, color: "#00D4FF", desc: "MRR growth rate and churn stability" },
            { label: "Product Health", score: productScore, max: 30, icon: Bug, color: "#22c55e", desc: "Bug count and issue resolution rate" },
            { label: "Financial Health", score: financialScore, max: 30, icon: DollarSign, color: "#f59e0b", desc: "Net margin and cost efficiency" },
          ].map((s: any) => (
            <div key={s.label} className="flex items-center gap-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sf-base border border-sf-border-subtle" style={{ boxShadow: `0 0 10px ${s.color}20` }}>
                <s.icon className="h-5 w-5 shrink-0" style={{ color: s.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-sf-text-primary">{s.label}</span>
                  <span className="text-xs font-bold text-sf-text-secondary">{s.score}/{s.max}</span>
                </div>
                <div className="h-2 rounded-full bg-sf-base overflow-hidden border border-sf-border-subtle/30 shadow-inner">
                  <div className="h-full rounded-full transition-all duration-700 shadow-sm" style={{ width: `${(s.score / s.max) * 100}%`, backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}60` }} />
                </div>
                <p className="text-[11px] font-medium text-sf-text-muted mt-2">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
