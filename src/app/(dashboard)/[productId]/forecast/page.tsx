"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { TrendUp, TrendDown, CircleNotch, Warning, CurrencyDollar, Calculator, Flame, ChartLineUp } from "@phosphor-icons/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc/provider";

function formatK(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
}

export default function ForecastPage() {
  const params = useParams();
  const productId = params.productId as string;

  const { data: product, isLoading } = trpc.product.get.useQuery({ id: productId });
  const { data: snapshots } = trpc.revenue.listSnapshots.useQuery({ productId });
  const { data: costs } = trpc.cost.list.useQuery({ productId });

  // Levers
  const [growthRate, setGrowthRate] = useState(10);
  const [churnRate, setChurnRate] = useState(3);
  const [newMrrPerMonth, setNewMrrPerMonth] = useState(500);
  const [scenario, setScenario] = useState<"base" | "optimistic" | "pessimistic">("base");

  const scenarioMultipliers = { optimistic: 1.5, base: 1, pessimistic: 0.5 };

  const forecast = useMemo(() => {
    if (!product) return [];
    const currentMrr = product.mrr || 0;
    const monthlyCosts = (costs || []).reduce((sum: any, c: any) => sum + c.amount, 0);
    const mult = scenarioMultipliers[scenario];
    const adjustedGrowth = growthRate * mult;
    const adjustedChurn = churnRate / mult;
    const adjustedNewMrr = newMrrPerMonth * mult;

    const months = [];
    let mrr = currentMrr;
    let cumulativeProfit = 0;

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + i);
      const month = monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const churned = mrr * (adjustedChurn / 100);
      const growth = mrr * (adjustedGrowth / 100);
      mrr = mrr - churned + growth + adjustedNewMrr;
      mrr = Math.max(0, mrr);

      const netRevenue = mrr - monthlyCosts;
      cumulativeProfit += netRevenue;

      months.push({ month, mrr, churned, newMrr: growth + adjustedNewMrr, netRevenue, cumulativeProfit, arr: mrr * 12 });
    }
    return months;
  }, [product, costs, growthRate, churnRate, newMrrPerMonth, scenario]);

  // Runway calculation
  const runwayMonths = useMemo(() => {
    if (!product || !costs) return null;
    const monthlyCosts = costs.reduce((sum, c) => sum + c.amount, 0);
    const netBurn = monthlyCosts - (product.mrr || 0);
    if (netBurn <= 0) return Infinity; // profitable
    return Math.ceil(monthlyCosts / netBurn * 12); // rough estimate
  }, [product, costs]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-sf-accent-cyan" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const currentThemeColor = scenario === "optimistic" ? "var(--color-sf-accent-emerald)" : scenario === "pessimistic" ? "var(--color-sf-accent-rose)" : "var(--color-sf-accent-cyan)";
  const currentThemeClass = scenario === "optimistic" ? "text-sf-accent-emerald" : scenario === "pessimistic" ? "text-sf-accent-rose" : "text-sf-accent-cyan";

  const summaryStats = [
    { label: "Projected MRR (12mo)", value: forecast[11]?.mrr || 0, prefix: "$", icon: ChartLineUp, color: "text-sf-accent-cyan", bg: "from-sf-accent-cyan/10" },
    { label: "Projected ARR", value: forecast[11]?.arr || 0, prefix: "$", icon: CurrencyDollar, color: "text-sf-accent-emerald", bg: "from-sf-accent-emerald/10" },
    { label: "Net Revenue (12mo)", value: forecast[11]?.cumulativeProfit || 0, prefix: "$", icon: Calculator, color: (forecast[11]?.cumulativeProfit || 0) >= 0 ? "text-sf-accent-emerald" : "text-sf-accent-rose", bg: (forecast[11]?.cumulativeProfit || 0) >= 0 ? "from-sf-accent-emerald/10" : "from-sf-accent-rose/10" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-display text-4xl text-white tracking-tight">AI Forecasting</h1>
          <p className="text-sm font-medium text-sf-text-secondary mt-1">12-month projections engine with scenario planning</p>
        </div>

        {/* Scenario tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-sf-bg-glass p-1.5 border border-sf-border-subtle shadow-inner">
          {(["pessimistic", "base", "optimistic"] as const).map((s) => (
            <button key={s} onClick={() => setScenario(s)}
              className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan ${scenario === s ? "bg-sf-bg-elevated text-white border border-sf-border-default shadow-md" : "text-sf-text-secondary hover:text-white border border-transparent"}`}>
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Levers */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-sf-border-subtle bg-sf-bg-elevated p-5 shadow-sm">
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-sf-text-muted mb-4">
            <span className="flex items-center gap-2"><TrendUp weight="bold" className="h-4 w-4 text-sf-accent-cyan" /> Growth Target</span>
            <span className="text-lg font-mono font-bold text-white leading-none">{growthRate}%</span>
          </label>
          <input type="range" min="0" max="50" value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value))} 
            className="w-full h-1.5 bg-sf-bg-base rounded-lg appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-sf-accent-cyan/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sf-accent-cyan [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform" />
        </div>
        
        <div className="rounded-2xl border border-sf-border-subtle bg-sf-bg-elevated p-5 shadow-sm">
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-sf-text-muted mb-4">
            <span className="flex items-center gap-2"><TrendDown weight="bold" className="h-4 w-4 text-sf-accent-rose" /> Monthly Churn</span>
            <span className="text-lg font-mono font-bold text-white leading-none">{churnRate}%</span>
          </label>
          <input type="range" min="0" max="20" step="0.5" value={churnRate} onChange={(e) => setChurnRate(Number(e.target.value))} 
            className="w-full h-1.5 bg-sf-bg-base rounded-lg appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-sf-accent-rose/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sf-accent-rose [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform" />
        </div>
        
        <div className="rounded-2xl border border-sf-border-subtle bg-sf-bg-elevated p-5 shadow-sm">
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-sf-text-muted mb-4">
            <span className="flex items-center gap-2"><CurrencyDollar weight="bold" className="h-4 w-4 text-purple-400" /> New MRR/Mo</span>
            <span className="text-lg font-mono font-bold text-white leading-none">${newMrrPerMonth}</span>
          </label>
          <input type="range" min="0" max="5000" step="100" value={newMrrPerMonth} onChange={(e) => setNewMrrPerMonth(Number(e.target.value))} 
            className="w-full h-1.5 bg-sf-bg-base rounded-lg appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-purple-400/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform" />
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => (
          <div key={s.label} className="relative rounded-xl border border-sf-border-subtle bg-sf-bg-elevated p-5 overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${s.bg} to-transparent opacity-50 rounded-bl-full`} />
            
            <div className="relative z-10">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-sf-text-muted mb-2 flex items-center gap-1.5">
                <s.icon weight="duotone" className={`h-4 w-4 ${s.color}`} />
                {s.label}
              </div>
              <div className={`text-3xl font-display text-white ${s.value < 0 ? 'text-sf-accent-rose' : ''}`}>
                {s.value < 0 ? '-' : ''}{s.prefix}<CountUp end={Math.abs(s.value)} duration={1.5} separator="," />
              </div>
            </div>
          </div>
        ))}
        
        {/* Runway Card */}
        <div className="relative rounded-xl border border-sf-border-subtle bg-sf-bg-elevated p-5 overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sf-accent-amber/10 to-transparent opacity-50 rounded-bl-full" />
          <div className="relative z-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-sf-text-muted mb-2 flex items-center gap-1.5">
              <Flame weight="fill" className="h-4 w-4 text-sf-accent-amber" />
              Cash Runway
            </div>
            <div className="text-3xl font-display text-white">
              {runwayMonths === Infinity ? "Infinite" : runwayMonths === null ? "—" : `${runwayMonths} mo.`}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Forecast Chart */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-sf-border-subtle bg-sf-bg-elevated p-6 shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sf-text-muted flex items-center gap-2">
            <ChartLineUp className="h-4 w-4" /> 12-Month MRR Projection Engine
          </h2>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-sf-text-muted animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-wide text-sf-text-secondary">AI Prediction Engine Active</span>
          </div>
        </div>
        
        <div className="h-72 w-full relative z-10">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-48 bg-sf-bg-elevated/80 blur-md z-10" />
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentThemeColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={currentThemeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-sf-border-subtle)" opacity={0.5} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-sf-text-muted)', fontWeight: 600, textAnchor: 'middle' }} dy={10} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--color-sf-text-muted)', fontWeight: 600 }}
                tickFormatter={(val: number) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                width={65}
                dx={-10}
              />
              <Tooltip
                cursor={{ stroke: 'var(--color-sf-border-default)', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-sf-border-subtle bg-[#0D1117]/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md min-w-[200px]">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-sf-text-muted border-b border-sf-border-subtle pb-2">{label}</p>
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-sf-text-secondary flex items-center gap-1.5"><ChartLineUp className="h-3 w-3" /> Projected MRR</span>
                            <span className={`font-mono text-sm font-bold ${currentThemeClass}`}>{formatK(data.mrr)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-sf-text-secondary flex items-center gap-1.5"><TrendUp className="h-3 w-3" /> New added</span>
                            <span className="font-mono text-[11px] font-semibold text-sf-accent-emerald">+{formatK(data.newMrr)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-sf-text-secondary flex items-center gap-1.5"><TrendDown className="h-3 w-3" /> Churned off</span>
                            <span className="font-mono text-[11px] font-semibold text-sf-accent-rose">-{formatK(data.churned)}</span>
                          </div>
                          <div className="h-px w-full bg-sf-border-subtle mt-1 mb-1" />
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-sf-text-secondary flex items-center gap-1.5"><Calculator className="h-3 w-3" /> Net Revenue</span>
                            <span className={`font-mono text-[11px] font-bold ${data.netRevenue >= 0 ? "text-sf-accent-emerald" : "text-sf-accent-rose"}`}>
                              {data.netRevenue >= 0 ? '+' : ''}{formatK(data.netRevenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke={currentThemeColor}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorArea)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "white", className: "shadow-[0_0_15px_rgba(255,255,255,0.8)]" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Forecast table */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-sf-border-subtle bg-sf-bg-elevated overflow-hidden shadow-sm">
        <div className="border-b border-sf-border-subtle bg-sf-bg-glass px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Monthly Breakdown Timeline</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sf-border-subtle bg-[#0D1117]/50">
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-sf-text-muted">Month</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-sf-text-muted">Projected MRR</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-sf-text-muted hidden sm:table-cell">New MRR Added</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-sf-text-muted hidden sm:table-cell">MRR Churned</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-sf-text-muted">Net Operating Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border-subtle/50">
              {forecast.map((f, i) => (
                <tr key={i} className="hover:bg-sf-bg-glass transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">{f.month}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-white group-hover:text-sf-accent-cyan transition-colors">${formatK(f.mrr)}</td>
                  <td className="px-6 py-4 text-right font-mono text-[13px] font-semibold text-sf-accent-emerald/80 hidden sm:table-cell">+{formatK(f.newMrr)}</td>
                  <td className="px-6 py-4 text-right font-mono text-[13px] font-semibold text-sf-accent-rose/80 hidden sm:table-cell">-{formatK(f.churned)}</td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${f.netRevenue >= 0 ? "text-sf-accent-emerald" : "text-sf-accent-rose"}`}>
                    {f.netRevenue >= 0 ? '+' : ''}{formatK(f.netRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
