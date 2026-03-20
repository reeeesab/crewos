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
    const monthlyCosts = costs.reduce((sum: any, c: any) => sum + c.amount, 0);
    const netBurn = monthlyCosts - (product.mrr || 0);
    if (netBurn <= 0) return Infinity; // profitable
    return Math.ceil(monthlyCosts / netBurn * 12); // rough estimate
  }, [product, costs]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-brand-primary" />
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

  const currentThemeColor = scenario === "optimistic" ? "var(--color-brand-emerald)" : scenario === "pessimistic" ? "var(--color-brand-rose)" : "var(--color-brand-primary)";
  const currentThemeClass = scenario === "optimistic" ? "text-emerald-400" : scenario === "pessimistic" ? "text-rose-400" : "text-brand-primary";

  const summaryStats = [
    { label: "Projected MRR (12mo)", value: forecast[11]?.mrr || 0, prefix: "$", icon: ChartLineUp, color: "text-brand-primary", bg: "from-brand-primary/10" },
    { label: "Projected ARR", value: forecast[11]?.arr || 0, prefix: "$", icon: CurrencyDollar, color: "text-emerald-400", bg: "from-emerald-500/10" },
    { label: "Net Revenue (12mo)", value: forecast[11]?.cumulativeProfit || 0, prefix: "$", icon: Calculator, color: (forecast[11]?.cumulativeProfit || 0) >= 0 ? "text-emerald-400" : "text-rose-400", bg: (forecast[11]?.cumulativeProfit || 0) >= 0 ? "from-emerald-500/10" : "from-rose-500/10" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-display text-4xl text-white tracking-tight">AI Forecasting</h1>
          <p className="text-sm font-medium text-brand-muted mt-1">12-month projections engine with scenario planning</p>
        </div>

        {/* Scenario tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-brand-surface p-1.5 border border-brand-border shadow-inner">
          {(["pessimistic", "base", "optimistic"] as const).map((s) => (
            <button key={s} onClick={() => setScenario(s)}
              className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${scenario === s ? "bg-brand-bg text-white border border-brand-border shadow-md" : "text-brand-muted hover:text-white border border-transparent"}`}>
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Levers */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-brand-muted mb-4">
            <span className="flex items-center gap-2"><TrendUp weight="bold" className="h-4 w-4 text-brand-primary" /> Growth Target</span>
            <span className="text-lg font-mono font-bold text-white leading-none">{growthRate}%</span>
          </label>
          <input type="range" min="0" max="50" value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value))} 
            className="w-full h-1.5 bg-brand-bg rounded-lg appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-brand-primary/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform" />
        </div>
        
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-brand-muted mb-4">
            <span className="flex items-center gap-2"><TrendDown weight="bold" className="h-4 w-4 text-rose-500" /> Monthly Churn</span>
            <span className="text-lg font-mono font-bold text-white leading-none">{churnRate}%</span>
          </label>
          <input type="range" min="0" max="20" step="0.5" value={churnRate} onChange={(e) => setChurnRate(Number(e.target.value))} 
            className="w-full h-1.5 bg-brand-bg rounded-lg appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-rose-500/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform" />
        </div>
        
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-brand-muted mb-4">
            <span className="flex items-center gap-2"><CurrencyDollar weight="bold" className="h-4 w-4 text-purple-400" /> New MRR/Mo</span>
            <span className="text-lg font-mono font-bold text-white leading-none">${newMrrPerMonth}</span>
          </label>
          <input type="range" min="0" max="5000" step="100" value={newMrrPerMonth} onChange={(e) => setNewMrrPerMonth(Number(e.target.value))} 
            className="w-full h-1.5 bg-brand-bg rounded-lg appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-purple-400/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform" />
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => (
          <div key={s.label} className="relative rounded-xl border border-brand-border bg-brand-surface p-5 overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${s.bg} to-transparent opacity-50 rounded-bl-full`} />
            
            <div className="relative z-10">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted mb-2 flex items-center gap-1.5">
                <s.icon weight="duotone" className={`h-4 w-4 ${s.color}`} />
                {s.label}
              </div>
              <div className={`text-3xl font-display text-white ${s.value < 0 ? 'text-rose-400' : ''}`}>
                {s.value < 0 ? '-' : ''}{s.prefix}<CountUp end={Math.abs(s.value)} duration={1.5} separator="," />
              </div>
            </div>
          </div>
        ))}
        
        {/* Runway Card */}
        <div className="relative rounded-xl border border-brand-border bg-brand-surface p-5 overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent opacity-50 rounded-bl-full" />
          <div className="relative z-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted mb-2 flex items-center gap-1.5">
              <Flame weight="fill" className="h-4 w-4 text-amber-500" />
              Cash Runway
            </div>
            <div className="text-3xl font-display text-white">
              {runwayMonths === Infinity ? "Infinite" : runwayMonths === null ? "—" : `${runwayMonths} mo.`}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Forecast Chart */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-muted flex items-center gap-2">
            <ChartLineUp className="h-4 w-4" /> 12-Month MRR Projection Engine
          </h2>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-brand-muted animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">AI Prediction Engine Active</span>
          </div>
        </div>
        
        <div className="h-72 w-full relative z-10">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-48 bg-brand-surface/80 blur-md z-10" />
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentThemeColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={currentThemeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-brand-border)" opacity={0.5} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-brand-muted)', fontWeight: 600, textAnchor: 'middle' }} dy={10} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--color-brand-muted)', fontWeight: 600 }}
                tickFormatter={(val: number) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                width={65}
                dx={-10}
              />
              <Tooltip
                cursor={{ stroke: 'var(--color-brand-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-brand-border bg-brand-surface/95 p-4 shadow-2xl backdrop-blur-md min-w-[200px]">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-brand-muted border-b border-brand-border pb-2">{label}</p>
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1.5"><ChartLineUp className="h-3 w-3" /> Projected MRR</span>
                            <span className={`font-mono text-sm font-bold ${currentThemeClass}`}>{formatK(data.mrr)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1.5"><TrendUp className="h-3 w-3" /> New added</span>
                            <span className="font-mono text-[11px] font-semibold text-emerald-400">+{formatK(data.newMrr)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1.5"><TrendDown className="h-3 w-3" /> Churned off</span>
                            <span className="font-mono text-[11px] font-semibold text-rose-400">-{formatK(data.churned)}</span>
                          </div>
                          <div className="h-px w-full bg-brand-border mt-1 mb-1" />
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1.5"><Calculator className="h-3 w-3" /> Net Revenue</span>
                            <span className={`font-mono text-[11px] font-bold ${data.netRevenue >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
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
      <motion.div variants={itemVariants} className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden shadow-sm">
        <div className="border-b border-brand-border bg-brand-bg/40 px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Monthly Breakdown Timeline</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg/50">
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-brand-muted">Month</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-brand-muted">Projected MRR</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-brand-muted hidden sm:table-cell">New MRR Added</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-brand-muted hidden sm:table-cell">MRR Churned</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-brand-muted">Net Operating Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {forecast.map((f, i) => (
                <tr key={i} className="hover:bg-brand-bg/30 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">{f.month}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-white group-hover:text-brand-primary transition-colors">${formatK(f.mrr)}</td>
                  <td className="px-6 py-4 text-right font-mono text-[13px] font-semibold text-emerald-400/80 hidden sm:table-cell">+{formatK(f.newMrr)}</td>
                  <td className="px-6 py-4 text-right font-mono text-[13px] font-semibold text-rose-400/80 hidden sm:table-cell">-{formatK(f.churned)}</td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${f.netRevenue >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
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
