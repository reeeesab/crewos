"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { 
  TrendUp, Pulse, ChartBar, Bug, Users, ArrowRight, ArrowsClockwise, 
  CircleNotch, Lightning, CurrencyDollar
} from "@phosphor-icons/react";
import { trpc } from "@/lib/trpc/provider";

function formatK(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    LIVE: "bg-sf-accent-emerald/10 text-sf-accent-emerald ring-1 ring-inset ring-sf-accent-emerald/20",
    BETA: "bg-sf-accent-cyan/10 text-sf-accent-cyan ring-1 ring-inset ring-sf-accent-cyan/20",
    ARCHIVED: "bg-sf-bg-glass text-sf-text-secondary ring-1 ring-inset ring-sf-border-subtle",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${styles[status] ?? ""}`}>{status}</span>;
}

export default function ProductDashboard() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const { data: product, isLoading } = trpc.product.get.useQuery({ id: productId });
  const { data: snapshots } = trpc.revenue.listSnapshots.useQuery({ productId });
  const { data: costs } = trpc.cost.list.useQuery({ productId });
  const { data: integration } = trpc.revenue.getIntegration.useQuery({ productId });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-sf-accent-cyan" />
      </div>
    );
  }

  if (!product) return (
    <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-sf-border-subtle bg-sf-bg-elevated/50">
      <Lightning weight="duotone" className="h-8 w-8 text-sf-accent-rose mb-3 opacity-80" />
      <div className="text-xl font-display text-white">Product not found</div>
      <p className="text-sm text-sf-text-secondary mt-1">The product you requested does not exist or has been deleted.</p>
    </div>
  );

  type RevenueSnapshot = NonNullable<typeof snapshots>[number];
  type CostItem = NonNullable<typeof costs>[number];

  const data: RevenueSnapshot[] = snapshots ?? [];
  const allCosts: CostItem[] = costs ?? [];
  const totalCosts = allCosts.reduce((sum: number, cost) => sum + cost.amount, 0);
  const netMargin = product.mrr - totalCosts;
  const openBugs = product.issues?.filter((i: any) => i.type === "BUG" && i.status !== "CLOSED").length || product.openBugs || 0;
  const recentData = data.slice(-12);
  const maxMrr = Math.max(...recentData.map((snapshot) => snapshot.mrr), 10);

  const healthScore = product.healthScore ?? 0;
  const isHealthy = healthScore >= 75;
  const healthColor = isHealthy ? "text-sf-accent-emerald" : healthScore >= 50 ? "text-sf-accent-amber" : "text-sf-accent-rose";
  const healthBg = isHealthy ? "from-sf-accent-emerald/10" : healthScore >= 50 ? "from-sf-accent-amber/10" : "from-sf-accent-rose/10";
  const healthBlur = isHealthy ? "bg-sf-accent-emerald" : healthScore >= 50 ? "bg-sf-accent-amber" : "bg-sf-accent-rose";

  const stats = [
    { label: "Monthly Revenue", value: product.mrr, prefix: "$", suffix: "", icon: ChartBar, color: "text-sf-accent-cyan", bg: "from-sf-accent-cyan/10", blur: "bg-sf-accent-cyan" },
    { label: "Integration Health", value: healthScore, prefix: "", suffix: "/100", icon: Pulse, color: healthColor, bg: healthBg, blur: healthBlur },
    { label: "Active Subs/Users", value: product.activeSubscriptions || product.activeUsers || 0, prefix: "", suffix: "", icon: Users, color: "text-purple-400", bg: "from-purple-500/10", blur: "bg-purple-500" },
    { label: "Open Bug Tickets", value: openBugs, prefix: "", suffix: "", icon: Bug, color: openBugs > 3 ? "text-sf-accent-rose" : "text-sf-text-muted", bg: openBugs > 3 ? "from-sf-accent-rose/10" : "from-transparent", blur: openBugs > 3 ? "bg-sf-accent-rose" : "bg-sf-bg-glass" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-4xl text-white tracking-tight">{product.name}</h1>
            <StatusBadge status={product.status} />
          </div>
          {product.website && (
             <a href={product.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-sf-accent-cyan hover:text-white transition-colors flex items-center gap-1.5 w-fit">
               {product.website} <ArrowRight weight="bold" className="h-3 w-3 -rotate-45" />
             </a>
          )}
        </div>
      </motion.div>

      {/* Hero Strip Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            variants={itemVariants}
            className="relative rounded-2xl border border-sf-border-subtle bg-sf-bg-elevated p-5 overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${s.bg} to-transparent opacity-50 rounded-bl-full`} />
            <div className={`absolute -top-6 -right-6 w-12 h-12 ${s.blur} opacity-20 blur-xl rounded-full`} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <s.icon weight="duotone" className={`h-5 w-5 ${s.color}`} />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-sf-text-muted">{s.label}</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-display text-white">
                  {s.prefix}
                  <CountUp end={s.value} duration={2} separator="," />
                  <span className="text-lg text-sf-text-secondary ml-0.5">{s.suffix}</span>
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: MRR Chart + Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* MRR Trend Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 rounded-2xl border border-sf-border-subtle bg-sf-bg-elevated p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay pointer-events-none" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sf-text-muted">Trailing MRR Trend</h2>
            <button onClick={() => router.push(`/${productId}/revenue`)} className="text-xs font-bold text-sf-accent-cyan hover:text-white transition-colors flex items-center gap-1.5 rounded-full bg-sf-accent-cyan/10 px-3 py-1 hover:bg-sf-accent-cyan/20">
              Explore Data <ArrowRight weight="bold" className="h-3 w-3" />
            </button>
          </div>
          
          <div className="flex items-end gap-2 h-40 relative z-10">
            {data.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-sf-text-muted">
                <ChartBar weight="duotone" className="h-10 w-10 opacity-20 mb-3" />
                <p className="text-xs font-medium">{integration ? "Awaiting initial data sync..." : "No payment provider configured."}</p>
              </div>
            ) : (
              recentData.map((snapshot, i) => {
                const pct = (snapshot.mrr / maxMrr) * 100;
                return (
                  <div key={snapshot.id} className="group/bar flex flex-1 flex-col items-center gap-2 relative">
                    <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-lg bg-[#0F141F] border border-sf-border-subtle px-2.5 py-1.5 text-[11px] font-mono font-bold text-white shadow-xl z-20 pointer-events-none whitespace-nowrap">
                      ${snapshot.mrr.toLocaleString()}
                    </div>
                    
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, 5)}%` }}
                      transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
                      className="w-full rounded-t-sm bg-sf-accent-cyan/20 hover:bg-sf-accent-cyan transition-colors cursor-pointer relative overflow-hidden" 
                    >
                       <div className="absolute top-0 inset-x-0 h-1 bg-sf-accent-cyan" />
                    </motion.div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-sf-text-muted">{new Date(snapshot.date).toLocaleDateString("en-US", { month: "short" })}</span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Core Financials Bento */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-sf-border-subtle bg-sf-bg-elevated p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
          
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sf-text-muted mb-6 relative z-10">Net Financials</h2>
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                   <div className="text-[10px] font-bold uppercase tracking-wider text-sf-text-muted mb-1 flex items-center gap-1.5"><TrendUp /> Gross MRR</div>
                   <div className="text-xl font-mono font-bold text-white">{product.mrr > 0 ? '$' : ''}<CountUp end={product.mrr} duration={1.5} separator="," /></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                   <div className="text-[10px] font-bold uppercase tracking-wider text-sf-text-muted mb-1 flex items-center gap-1.5"><CurrencyDollar /> Total OPEX</div>
                   <div className="text-xl font-mono font-bold text-sf-accent-rose">{totalCosts > 0 ? '$' : ''}<CountUp end={totalCosts} duration={1.5} separator="," /></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-5 border-t border-sf-border-subtle relative z-10">
             <div className="text-[10px] font-bold uppercase tracking-wider text-sf-text-muted mb-1">Net Operating Margin</div>
             <div className="flex items-end gap-3">
                <div className={`text-3xl font-display ${netMargin >= 0 ? "text-sf-accent-emerald" : "text-sf-accent-rose"}`}>
                  ${formatK(Math.abs(netMargin))}
                </div>
                {product.mrr > 0 && (
                   <div className={`text-sm font-bold mb-1.5 ${netMargin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                     {netMargin >= 0 ? '+' : '-'}{(Math.abs(netMargin) / product.mrr * 100).toFixed(1)}%
                   </div>
                )}
             </div>
             
             <button onClick={() => router.push(`/${productId}/costs`)} className="w-full mt-6 flex items-center justify-center gap-2 rounded-lg bg-sf-bg-glass border border-sf-border-subtle px-4 py-2.5 text-xs font-bold text-sf-text-secondary hover:text-white hover:border-sf-border-default transition-all">
               Analyze Cost Centers
             </button>
          </div>
        </motion.div>
      </div>

      {/* Row 3: Quick Modules (Bento Grid tiles) */}
      <motion.div variants={itemVariants}>
         <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sf-text-muted mb-4 ml-1">Core Modules</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "Revenue Engine", href: `/${productId}/revenue`, icon: ChartBar, desc: "MRR & churn analytics", color: "text-sf-accent-cyan" },
             { label: "Growth Predictor", href: `/${productId}/forecast`, icon: TrendUp, desc: "AI 12-month projections", color: "text-purple-400" },
             { label: "System Health", href: `/${productId}/health`, icon: Pulse, desc: `Real-time status: ${healthScore}`, color: healthColor },
             { label: "Exit Strategy", href: `/${productId}/acquisition`, icon: ArrowsClockwise, desc: "AI acquisition report", color: "text-sf-accent-amber" },
           ].map((link, i) => (
             <button key={link.label} onClick={() => router.push(link.href)}
               className="group relative rounded-2xl border border-sf-border-subtle bg-sf-bg-elevated p-5 text-left overflow-hidden transition-all hover:border-sf-border-default hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan"
             >
               <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-current blur-3xl ${link.color}`} />
               </div>
               
               <div className={`h-10 w-10 rounded-xl bg-sf-bg-glass border border-sf-border-subtle flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${link.color}`}>
                 <link.icon weight="duotone" className="h-5 w-5" />
               </div>
               <div className="text-sm font-bold text-white mb-1 tracking-tight">{link.label}</div>
               <div className="text-[11px] font-medium text-sf-text-secondary">{link.desc}</div>
               
               <div className="absolute top-5 right-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight weight="bold" className={`h-4 w-4 ${link.color}`} />
               </div>
             </button>
           ))}
         </div>
      </motion.div>
    </motion.div>
  );
}
