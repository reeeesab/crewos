"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  TrendUp, ChartBar, Pulse, Users, Plus, Lightning, CircleNotch,
  CaretRight, MagnifyingGlass, Funnel, Faders
} from "@phosphor-icons/react";
import { trpc } from "@/lib/trpc/provider";

function formatK(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    LIVE: "bg-sf-accent-emerald/10 text-sf-accent-emerald ring-1 ring-inset ring-sf-accent-emerald/20",
    BETA: "bg-sf-accent-cyan/10 text-sf-accent-cyan ring-1 ring-inset ring-sf-accent-cyan/20",
    ARCHIVED: "bg-sf-bg-glass text-sf-text-secondary ring-1 ring-inset ring-sf-border-subtle",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[status] ?? ""}`}>{status}</span>;
}

function CreateProductModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", type: "B2B SaaS", status: "BETA" as const, website: "" });
  const create = trpc.product.create.useMutation({
    onSuccess: (product) => router.push(`/${product.id}`),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-sf-border-default bg-sf-bg-elevated shadow-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sf-accent-cyan to-blue-600" />
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-sf-bg-glass border border-sf-border-subtle">
            <Lightning weight="fill" className="h-4 w-4 text-sf-accent-cyan" />
          </div>
          <h3 className="font-display text-xl text-white">Add Product</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-sf-text-secondary mb-1.5 uppercase tracking-wide">Product name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-sf-border-subtle bg-sf-bg-base px-3 py-2.5 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-border-default focus:ring-1 focus:ring-sf-accent-cyan focus:outline-none transition-all shadow-inner" placeholder='e.g. "ShipFast"' />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-sf-text-secondary mb-1.5 uppercase tracking-wide">Type</label>
              <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-sf-border-subtle bg-sf-bg-base px-3 py-2.5 text-sm text-sf-text-primary focus:border-sf-border-default focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-sf-text-secondary mb-1.5 uppercase tracking-wide">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full rounded-lg border border-sf-border-subtle bg-sf-bg-base px-3 py-2.5 text-sm text-sf-text-primary focus:border-sf-border-default focus:outline-none transition-all appearance-none">
                <option value="BETA">Beta</option>
                <option value="LIVE">Live</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-sf-text-secondary mb-1.5 uppercase tracking-wide">Website</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full rounded-lg border border-sf-border-subtle bg-sf-bg-base px-3 py-2.5 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-border-default focus:outline-none transition-all" placeholder="https://" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-sf-text-secondary mb-1.5 uppercase tracking-wide">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full rounded-lg border border-sf-border-subtle bg-sf-bg-base px-3 py-2.5 text-sm text-sf-text-primary focus:border-sf-border-default focus:outline-none transition-all resize-none" />
          </div>
        </div>
        {create.error && <div className="mt-4 rounded-lg bg-sf-accent-rose/10 border border-sf-accent-rose/20 px-3 py-2 text-xs text-sf-accent-rose font-medium">{create.error.message}</div>}
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 rounded-lg border border-sf-border-subtle bg-sf-bg-glass px-4 py-2.5 text-sm font-semibold text-sf-text-secondary hover:text-white hover:bg-sf-border-subtle transition-all outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan">Cancel</button>
          <button onClick={() => create.mutate(form)} disabled={!form.name || create.isPending}
            className="flex-1 rounded-lg bg-sf-accent-cyan px-4 py-2.5 text-sm font-bold text-sf-bg-base hover:bg-[#00e5ff] transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] disabled:opacity-50 disabled:shadow-none outline-none focus-visible:ring-2 focus-visible:ring-white">
            {create.isPending ? <CircleNotch weight="bold" className="h-4 w-4 animate-spin mx-auto" /> : "Create Product"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PortfolioPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: products, isLoading } = trpc.product.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-sf-accent-cyan" />
      </div>
    );
  }

  const allProducts = products ?? [];
  const totalMrr = allProducts.reduce((s, p) => s + p.mrr, 0);
  const totalArr = totalMrr * 12;
  const totalUsers = allProducts.reduce((s, p) => s + p.activeUsers, 0);
  const avgHealth = allProducts.length > 0 ? Math.round(allProducts.reduce((s, p) => s + (p.healthScore ?? 0), 0) / allProducts.length) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-white tracking-tight">Portfolio</h1>
          <p className="text-sm font-medium text-sf-text-secondary mt-1">Command center for your SaaS empire</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="group flex items-center gap-2 rounded-lg bg-sf-text-primary px-4 py-2 text-sm font-bold text-sf-bg-base hover:bg-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan w-fit">
          <Plus weight="bold" className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Hero Strip Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total MRR", value: totalMrr, prefix: "$", suffix: "", icon: ChartBar, color: "text-sf-accent-cyan", bg: "from-sf-accent-cyan/10 to-transparent", blur: "bg-sf-accent-cyan" },
          { label: "Total ARR", value: totalArr, prefix: "$", suffix: "", icon: TrendUp, color: "text-sf-accent-emerald", bg: "from-sf-accent-emerald/10 to-transparent", blur: "bg-sf-accent-emerald" },
          { label: "Active Users", value: totalUsers, prefix: "", suffix: "", icon: Users, color: "text-sf-accent-amber", bg: "from-sf-accent-amber/10 to-transparent", blur: "bg-sf-accent-amber" },
          { label: "Avg Health", value: avgHealth, prefix: "", suffix: "/100", icon: Pulse, color: avgHealth >= 75 ? "text-sf-accent-emerald" : "text-sf-accent-amber", bg: avgHealth >= 75 ? "from-sf-accent-emerald/10 to-transparent" : "from-sf-accent-amber/10 to-transparent", blur: avgHealth >= 75 ? "bg-sf-accent-emerald" : "bg-sf-accent-amber" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.05 + 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-xl border border-sf-border-subtle bg-sf-bg-elevated p-5 overflow-hidden group"
          >
            {/* Ambient Background Gradient */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${s.bg} opacity-50 rounded-bl-full`} />
            <div className={`absolute -top-6 -right-6 w-12 h-12 ${s.blur} opacity-20 blur-xl rounded-full`} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <s.icon weight="duotone" className={`h-5 w-5 ${s.color}`} />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-sf-text-muted">{s.label}</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-display text-white">
                  {s.prefix}
                  <CountUp end={s.value} duration={2} separator="," />
                  {s.suffix && <span className="text-lg text-sf-text-muted">{s.suffix}</span>}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sort & Filter Bar */}
      {allProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center py-2">
          <div className="relative w-full sm:w-[300px]">
             <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-sf-text-muted" size={16} />
             <input 
               type="text" 
               placeholder="Filter portfolio..." 
               className="w-full bg-sf-bg-elevated border border-sf-border-subtle rounded-lg py-2 pl-9 pr-4 text-sm text-sf-text-primary placeholder:text-sf-text-muted outline-none focus:border-sf-border-default focus:ring-1 focus:ring-sf-accent-cyan transition-all"
             />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sf-bg-elevated border border-sf-border-subtle text-sm font-medium text-sf-text-secondary hover:text-white hover:border-sf-border-default transition-all">
                <Funnel size={16} /> Filter
             </button>
             <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sf-bg-elevated border border-sf-border-subtle text-sm font-medium text-sf-text-secondary hover:text-white hover:border-sf-border-default transition-all">
                <Faders size={16} /> Sort by: MRR
             </button>
          </div>
        </div>
      )}

      {/* Product List / Grid */}
      {allProducts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center h-64 rounded-xl border border-sf-border-subtle border-dashed bg-sf-bg-elevated/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sf-bg-glass border border-sf-border-subtle mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Lightning weight="duotone" className="h-6 w-6 text-sf-text-muted" />
          </div>
          <p className="text-base font-bold text-white mb-1">No products deployed</p>
          <p className="text-sm font-medium text-sf-text-secondary mb-6">Initialize your first SaaS product to start tracking metrics.</p>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-sf-bg-glass border border-sf-border-default px-4 py-2 text-sm font-bold text-white hover:bg-sf-border-subtle transition-all outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan">
            <Plus weight="bold" className="h-4 w-4" /> Create Product
          </button>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {allProducts.map((p) => (
            <Link key={p.id} href={`/${p.id}`} className="block outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-sf-accent-cyan">
              <motion.div 
                variants={itemVariants}
                className="group relative rounded-xl border border-sf-border-subtle bg-sf-bg-elevated p-5 transition-all hover:-translate-y-1 hover:border-sf-border-default hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sf-accent-cyan opacity-5 blur-[60px]" />
                </div>
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <h3 className="font-display text-xl text-white mb-1 tracking-tight">{p.name}</h3>
                    {p.website && <p className="text-[11px] font-medium text-sf-text-secondary truncate max-w-[180px]">{p.website}</p>}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-6 border-t border-sf-border-subtle pt-4 relative z-10">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sf-text-muted mb-1">MRR</div>
                    <div className="font-mono text-base font-semibold text-white tracking-tight">${formatK(p.mrr)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sf-text-muted mb-1">Users</div>
                    <div className="font-mono text-base font-semibold text-white tracking-tight">{formatK(p.activeUsers)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sf-text-muted mb-1 flex items-center gap-1.5">
                       Health
                       <div className="flex-1 h-1.5 rounded-full bg-sf-bg-base overflow-hidden max-w-[32px]">
                         <div className={`h-full rounded-full ${(p.healthScore ?? 0) >= 75 ? "bg-sf-accent-emerald" : (p.healthScore ?? 0) >= 50 ? "bg-sf-accent-amber" : "bg-sf-accent-rose"}`} style={{ width: `${p.healthScore ?? 0}%` }} />
                       </div>
                    </div>
                    <div className="font-mono text-base font-semibold text-white tracking-tight">{p.healthScore ?? 0}<span className="text-sf-text-muted text-[10px]">/100</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sf-text-muted mb-1">Bugs</div>
                    <div className="font-mono text-base font-semibold text-sf-text-secondary tracking-tight">{(p as any)._count?.issues || 0}</div>
                  </div>
                </div>

                <div className="absolute bottom-5 right-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                   <div className="w-8 h-8 rounded-full bg-sf-bg-glass border border-sf-border-subtle flex items-center justify-center">
                     <CaretRight weight="bold" className="text-sf-text-primary h-4 w-4" />
                   </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}

      {showCreate && <CreateProductModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
