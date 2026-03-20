"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bug,
  CalendarClock,
  DollarSign,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc/provider";
import { cn } from "@/lib/utils";

type ScoreTone = "healthy" | "attention" | "unknown";

function GaugeRing({ value, label, color }: { value: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          className="text-brand-border/30"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="transition-all duration-700 drop-shadow-[0_0_8px_currentColor]"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="text-lg font-bold"
          fill="white"
          fontSize="22"
        >
          {value}
        </text>
      </svg>
      <span className="mt-3 text-xs font-bold uppercase tracking-wider text-brand-muted">{label}</span>
    </div>
  );
}

function toneClasses(tone: ScoreTone) {
  if (tone === "healthy") {
    return {
      border: "border-emerald-500/20",
      value: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]",
      badge: "text-emerald-400/80",
      badgeText: "HEALTHY",
    };
  }
  if (tone === "attention") {
    return {
      border: "border-rose-500/30",
      value: "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,113,0.4)]",
      badge: "text-rose-400/80",
      badgeText: "ATTENTION",
    };
  }
  return {
    border: "border-brand-border",
    value: "text-white",
    badge: "text-brand-muted",
    badgeText: "NO DATA",
  };
}

function formatRelativeTime(value: Date | null) {
  if (!value) return "just now";
  const deltaMs = Date.now() - value.getTime();
  const minutes = Math.floor(deltaMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function calculateHealth(input: {
  mrr: number;
  churnRate: number;
  snapshots: Array<{ mrr: number; date: Date | string }>;
  totalCosts: number;
  openBugs: number;
  totalIssues: number;
  closedIssues: number;
}) {
  const { mrr, churnRate, snapshots, totalCosts, openBugs, totalIssues, closedIssues } = input;

  let revenueScore = 0;
  let mrrGrowthPct: number | null = null;
  if (snapshots.length >= 2) {
    const latest = snapshots[snapshots.length - 1];
    const prev = snapshots[snapshots.length - 2];
    mrrGrowthPct = prev.mrr > 0 ? ((latest.mrr - prev.mrr) / prev.mrr) * 100 : null;
    const growthForScore = mrrGrowthPct ?? 0;
    if (growthForScore > 10) revenueScore += 20;
    else if (growthForScore > 5) revenueScore += 15;
    else if (growthForScore > 0) revenueScore += 10;
  } else if (mrr > 0) {
    revenueScore += 10;
  }

  if (churnRate <= 2) revenueScore += 20;
  else if (churnRate <= 5) revenueScore += 15;
  else if (churnRate <= 10) revenueScore += 10;

  let productScore = 0;
  if (openBugs === 0) productScore += 15;
  else if (openBugs <= 3) productScore += 10;
  else if (openBugs <= 5) productScore += 5;

  const closedPct = totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0;
  if (closedPct > 70) productScore += 15;
  else if (closedPct > 40) productScore += 10;
  else productScore += 5;

  let financialScore = 0;
  const netMargin = mrr - totalCosts;
  const marginPct = mrr > 0 ? (netMargin / mrr) * 100 : 0;
  const costRatioPct = mrr > 0 ? (totalCosts / mrr) * 100 : null;

  if (marginPct > 60) financialScore += 15;
  else if (marginPct > 30) financialScore += 10;
  else if (marginPct > 0) financialScore += 5;

  if (totalCosts < mrr * 0.3) financialScore += 15;
  else if (totalCosts < mrr * 0.6) financialScore += 10;
  else financialScore += 5;

  const totalScore = Math.min(100, revenueScore + productScore + financialScore);

  return {
    revenueScore,
    productScore,
    financialScore,
    totalScore,
    mrrGrowthPct,
    closedPct,
    marginPct,
    costRatioPct,
    netMargin,
  };
}

export default function HealthPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const productQuery = trpc.product.get.useQuery({ id: productId });
  const snapshotsQuery = trpc.revenue.listSnapshots.useQuery({ productId });
  const costsQuery = trpc.cost.list.useQuery({ productId });
  const recommendationsQuery = trpc.health.recommendations.useQuery({ productId });

  const [lastCalculatedAt, setLastCalculatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (productQuery.data?.updatedAt) {
      setLastCalculatedAt(new Date(productQuery.data.updatedAt));
    }
  }, [productQuery.data?.updatedAt]);

  const recalculate = trpc.health.recalculate.useMutation({
    onSuccess: async (data) => {
      setLastCalculatedAt(new Date(data.calculatedAt));
      await Promise.all([
        productQuery.refetch(),
        snapshotsQuery.refetch(),
        costsQuery.refetch(),
        recommendationsQuery.refetch(),
      ]);
    },
  });

  if (productQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-muted" />
      </div>
    );
  }

  const product = productQuery.data;
  if (!product) return <div>Product not found</div>;

  const allSnapshots = snapshotsQuery.data ?? [];
  const allCosts = costsQuery.data ?? [];
  const totalCosts = allCosts.reduce((sum: number, cost: { amount: number }) => sum + cost.amount, 0);
  const openBugs = product.issues?.filter((issue: { type: string; status: string }) => issue.type === "BUG" && issue.status !== "CLOSED").length || 0;
  const totalIssues = product.issues?.length || 0;
  const closedIssues = product.issues?.filter((issue: { status: string }) => issue.status === "CLOSED").length || 0;

  const health = calculateHealth({
    mrr: product.mrr,
    churnRate: product.churnRate,
    snapshots: allSnapshots,
    totalCosts,
    openBugs,
    totalIssues,
    closedIssues,
  });

  const revenueRing = Math.round((health.revenueScore / 40) * 100);
  const productRing = Math.round((health.productScore / 30) * 100);
  const financialRing = Math.round((health.financialScore / 30) * 100);

  const scoreColor = health.totalScore >= 75 ? "#10b981" : health.totalScore >= 50 ? "#f59e0b" : "#f43f5e";

  const trendPoints = useMemo(() => {
    if (allSnapshots.length === 0) return [] as Array<{ label: string; score: number; date: string }>;

    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = allSnapshots.filter((snapshot: { date: Date | string }) => new Date(snapshot.date).getTime() >= cutoff);
    const source = recent.length >= 2 ? recent : allSnapshots.slice(-12);

    return source.map((snapshot: { mrr: number; date: Date | string }, index: number) => {
      const miniScores = calculateHealth({
        mrr: snapshot.mrr,
        churnRate: product.churnRate,
        snapshots: source.slice(0, index + 1),
        totalCosts,
        openBugs,
        totalIssues,
        closedIssues,
      });

      const d = new Date(snapshot.date);
      return {
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        date: d.toISOString(),
        score: miniScores.totalScore,
      };
    });
  }, [allSnapshots, product.churnRate, totalCosts, openBugs, totalIssues, closedIssues]);

  const factors = [
    {
      label: "MRR Growth",
      value: health.mrrGrowthPct === null ? "N/A" : `${health.mrrGrowthPct.toFixed(1)}%`,
      tone: (health.mrrGrowthPct === null ? "unknown" : health.mrrGrowthPct > 0 ? "healthy" : "attention") as ScoreTone,
      detail:
        health.mrrGrowthPct === null
          ? "No revenue data yet. Connect Stripe or DodoPayment in Settings to track MRR growth."
          : health.mrrGrowthPct > 0
            ? "Growth is positive. Keep pushing top-performing channels."
            : "Growth is flat/down. Run a pricing or activation experiment this week.",
      benchmark: "Healthy range: >5% month-over-month",
      href: `/${productId}/settings`,
      cta: "Go to Settings",
    },
    {
      label: "Churn Rate",
      value: `${product.churnRate.toFixed(1)}%`,
      tone: (product.mrr <= 0 ? "unknown" : product.churnRate < 3 ? "healthy" : "attention") as ScoreTone,
      detail:
        product.mrr <= 0
          ? "No paying subscriptions tracked yet, so churn can look artificially low."
          : product.churnRate < 3
            ? "Retention looks healthy."
            : "Churn is above target. Improve onboarding and cancellation recovery.",
      benchmark: "Healthy range: <3% · SaaS median: ~2.4%",
      href: `/${productId}/revenue`,
      cta: "Open Revenue",
    },
    {
      label: "Open Bugs",
      value: `${openBugs}`,
      tone: (openBugs <= 3 ? "healthy" : "attention") as ScoreTone,
      detail:
        openBugs === 0
          ? "No open bugs. Great product stability signal."
          : `${openBugs} open bug${openBugs > 1 ? "s" : ""} currently impacting product health.`,
      benchmark: "Healthy range: 0-3 open bugs",
      href: `/${productId}/roadmap?filter=bugs`,
      cta: "Open Issues",
    },
    {
      label: "Issue Resolution",
      value: totalIssues > 0 ? `${health.closedPct.toFixed(0)}%` : "N/A",
      tone: (totalIssues === 0 ? "unknown" : health.closedPct > 50 ? "healthy" : "attention") as ScoreTone,
      detail:
        totalIssues === 0
          ? "No issue history yet. Start tracking work in Roadmap to measure velocity."
          : "Resolved issues over total issues for this product.",
      benchmark: "Healthy range: >60% resolved",
      href: `/${productId}/roadmap`,
      cta: "Open Roadmap",
    },
    {
      label: "Net Margin",
      value: `${health.marginPct.toFixed(0)}%`,
      tone: (health.marginPct > 40 ? "healthy" : "attention") as ScoreTone,
      detail:
        product.mrr <= 0
          ? "No revenue tracked yet. Once Stripe connects, margin = MRR − monthly costs."
          : health.marginPct > 40
            ? "Margin is in healthy range."
            : "Below healthy range (>40%). Reduce cost ratio or improve MRR.",
      benchmark: "Healthy range: >40%",
      href: `/${productId}/costs`,
      cta: "Open Cost Tracker",
    },
    {
      label: "Cost Ratio",
      value: health.costRatioPct === null ? "N/A" : `${health.costRatioPct.toFixed(0)}%`,
      tone: (health.costRatioPct === null
        ? "unknown"
        : health.costRatioPct < 50
          ? "healthy"
          : "attention") as ScoreTone,
      detail:
        health.costRatioPct === null
          ? "No revenue data yet. Connect Stripe or DodoPayment to calculate this ratio."
          : "Monthly costs as a percentage of MRR.",
      benchmark: "Healthy range: <50%",
      href: `/${productId}/settings`,
      cta: "Connect Revenue",
    },
  ];

  const breakdown = [
    {
      label: "Revenue Health",
      score: health.revenueScore,
      max: 40,
      weight: 40,
      icon: TrendingUp,
      color: "#22d3ee",
      desc: "MRR growth rate and churn stability",
    },
    {
      label: "Product Health",
      score: health.productScore,
      max: 30,
      weight: 30,
      icon: Bug,
      color: "#10b981",
      desc: "Bug count and issue resolution rate",
    },
    {
      label: "Financial Health",
      score: health.financialScore,
      max: 30,
      weight: 30,
      icon: DollarSign,
      color: "#f59e0b",
      desc: "Net margin and cost efficiency",
    },
  ];

  const defaultRecommendations = [
    "Connect Stripe or DodoPayment in Settings to unlock full Revenue Health scoring and replace MRR Growth N/A with live values.",
    "Add monthly costs in Cost Tracker to improve Financial Health accuracy and raise margin visibility above the healthy >40% benchmark.",
    "Resolve open bugs in Roadmap to increase Product Health and move your overall score upward faster.",
  ];

  const recommendationItems =
    recommendationsQuery.data?.items && recommendationsQuery.data.items.length > 0
      ? recommendationsQuery.data.items
      : defaultRecommendations;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Health Score</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Computed from your live data
            <span className="mx-2">·</span>
            Last calculated: {formatRelativeTime(lastCalculatedAt)}
          </p>
        </div>
        <button
          onClick={() => recalculate.mutate({ productId })}
          disabled={recalculate.isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-xs font-semibold text-brand-muted hover:text-white disabled:opacity-50"
        >
          {recalculate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Recalculate now
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-xl backdrop-blur-xl">
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/5 blur-[80px]" />
        <div className="relative flex flex-col items-center justify-center gap-14 md:flex-row">
          <div className="flex flex-col items-center">
            <svg width="180" height="180" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="68" fill="none" stroke="currentColor" className="text-brand-border/30" strokeWidth="10" />
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 68}
                strokeDashoffset={2 * Math.PI * 68 - (health.totalScore / 100) * 2 * Math.PI * 68}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                className="transition-all duration-1000 drop-shadow-[0_0_12px_currentColor]"
              />
              <text x="80" y="74" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="36" fontWeight="bold">
                {health.totalScore}
              </text>
              <text x="80" y="100" textAnchor="middle" fill="var(--color-brand-muted)" fontSize="11" fontWeight="600">
                / 100
              </text>
            </svg>
            <span className="mt-4 text-sm font-bold uppercase tracking-widest" style={{ color: scoreColor }}>
              {health.totalScore >= 75 ? "Excellent" : health.totalScore >= 50 ? "Moderate" : "Needs Attention"}
            </span>
          </div>

          <div className="flex gap-6">
            <GaugeRing value={revenueRing} label="Revenue" color="#06b6d4" />
            <GaugeRing value={productRing} label="Product" color="#10b981" />
            <GaugeRing value={financialRing} label="Financial" color="#f59e0b" />
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-brand-border bg-brand-bg/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            <CalendarClock className="h-3.5 w-3.5" />
            30-day score trend
          </div>
          {trendPoints.length >= 2 ? (
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendPoints}>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--color-brand-muted)", fontSize: 10 }}
                    minTickGap={28}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    cursor={{ stroke: "var(--color-brand-border)", strokeDasharray: "4 4" }}
                    contentStyle={{
                      background: "var(--color-brand-surface)",
                      border: "1px solid var(--color-brand-border)",
                      borderRadius: "10px",
                      color: "white",
                    }}
                    formatter={(value) => [`${Number(value ?? 0)}/100`, "Score"] as [string, string]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: "#22d3ee" }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-brand-muted">Not enough history yet. Keep syncing snapshots to see health momentum.</p>
          )}
        </div>
      </div>

      {health.financialScore <= 20 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-500">
                Financial Health is critically low ({health.financialScore}/30)
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                This is dragging your overall score by {Math.max(0, 30 - health.financialScore)} points. Add or optimize monthly costs in Cost Tracker.
              </p>
            </div>
            <button
              onClick={() => router.push(`/${productId}/costs`)}
              className="shrink-0 rounded-lg border border-amber-500/50 px-3 py-1.5 text-xs font-semibold text-amber-500 hover:bg-amber-500/10"
            >
              Open Cost Tracker
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {factors.map((factor) => {
          const styles = toneClasses(factor.tone);
          return (
            <button
              key={factor.label}
              onClick={() => router.push(factor.href)}
              className={cn(
                "relative overflow-hidden rounded-2xl border bg-brand-surface/50 p-5 text-left shadow-lg backdrop-blur-md transition-all hover:border-brand-border",
                styles.border,
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-brand-bg/50 opacity-50" />
              <div className="relative z-10 mb-2 w-full truncate text-[11px] font-bold uppercase tracking-widest text-brand-muted">{factor.label}</div>
              <div className={cn("relative z-10 text-2xl font-bold tracking-tight", styles.value)}>{factor.value}</div>
              <div className={cn("relative z-10 mt-2 text-[10px] font-bold uppercase tracking-wider", styles.badge)}>
                {styles.badgeText}
              </div>
              <p className="relative z-10 mt-3 text-xs text-brand-muted">{factor.detail}</p>
              <p className="relative z-10 mt-2 text-[11px] text-brand-muted">{factor.benchmark}</p>
              <div className="relative z-10 mt-3 text-[11px] font-semibold text-brand-primary">→ {factor.cta}</div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-brand-border bg-brand-surface p-7 shadow-lg backdrop-blur-xl">
        <h2 className="mb-6 text-[11px] font-bold uppercase tracking-widest text-brand-muted">Score Breakdown</h2>
        <div className="space-y-5">
          {breakdown.map((section) => {
            const percent = Math.round((section.score / section.max) * 100);
            return (
              <div key={section.label} className="flex items-center gap-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-bg"
                  style={{ boxShadow: `0 0 10px ${section.color}20` }}
                >
                  <section.icon className="h-5 w-5 shrink-0" style={{ color: section.color }} />
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {section.label} ({section.weight}%)
                    </span>
                    <span className="text-xs font-bold text-brand-muted">
                      {section.score}/{section.max} · {percent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border border-brand-border bg-brand-bg shadow-inner">
                    <div
                      className="h-full rounded-full shadow-sm transition-all duration-700"
                      style={{
                        width: `${(section.score / section.max) * 100}%`,
                        backgroundColor: section.color,
                        boxShadow: `0 0 8px ${section.color}60`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-brand-muted">{section.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-brand-primary" />
          What to improve
        </div>

        {recommendationsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-brand-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating founder recommendations...
          </div>
        ) : recommendationsQuery.isError ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
            AI recommendations are unavailable right now. Showing fallback suggestions.
          </div>
        ) : null}

        <ol className="space-y-2 text-sm text-brand-muted">
          {recommendationItems.slice(0, 3).map((item, index) => (
            <li key={`${index}-${item}`} className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-bg text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex items-center gap-2 text-xs text-brand-muted">
          <AlertTriangle className="h-3.5 w-3.5" />
          Ranked by impact based on your current metrics.
        </div>
      </div>
    </div>
  );
}
