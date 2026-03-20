"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  CaretRight,
  ChartBar,
  CircleNotch,
  Faders,
  Funnel,
  Key,
  Lightning,
  MagnifyingGlass,
  Plus,
  Pulse,
  TrendUp,
  Users,
} from "@phosphor-icons/react";
import { trpc } from "@/lib/trpc/provider";

function formatK(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    LIVE: "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
    BETA: "bg-brand-accent/10 text-brand-accent ring-1 ring-inset ring-brand-accent/20",
    ARCHIVED: "bg-brand-surface-2 text-brand-muted ring-1 ring-inset ring-brand-border",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

function CreateProductModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "B2B SaaS",
    status: "BETA" as "BETA" | "LIVE",
    website: "",
  });
  const create = trpc.product.create.useMutation({
    onSuccess: (product) => router.push(`/${product.id}`),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-2xl"
      >
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-brand-accent to-blue-600" />
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-brand-border bg-brand-bg">
            <Lightning weight="fill" className="h-4 w-4 text-brand-accent" />
          </div>
          <h3 className="font-display text-xl text-white">Add Product</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-muted">Product name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted shadow-inner transition-all focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder='e.g. "ShipFast"'
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sf-text-secondary">Type</label>
              <input
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-sf-border-subtle bg-sf-bg-base px-3 py-2.5 text-sm text-sf-text-primary transition-all focus:border-sf-border-default focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sf-text-secondary">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "BETA" | "LIVE" })}
                className="w-full appearance-none rounded-lg border border-sf-border-subtle bg-sf-bg-base px-3 py-2.5 text-sm text-sf-text-primary transition-all focus:border-sf-border-default focus:outline-none"
              >
                <option value="BETA">Beta</option>
                <option value="LIVE">Live</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sf-text-secondary">Website</label>
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full rounded-lg border border-sf-border-subtle bg-sf-bg-base px-3 py-2.5 text-sm text-sf-text-primary placeholder:text-sf-text-muted transition-all focus:border-sf-border-default focus:outline-none"
              placeholder="https://"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sf-text-secondary">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-lg border border-sf-border-subtle bg-sf-bg-base px-3 py-2.5 text-sm text-sf-text-primary transition-all focus:border-sf-border-default focus:outline-none"
            />
          </div>
        </div>

        {create.error && (
          <div className="mt-4 rounded-lg border border-sf-accent-rose/20 bg-sf-accent-rose/10 px-3 py-2 text-xs font-medium text-sf-accent-rose">
            {create.error.message}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-brand-border bg-brand-surface-2 px-4 py-2.5 text-sm font-semibold text-brand-muted transition-all hover:bg-brand-surface hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => create.mutate(form)}
            disabled={!form.name || create.isPending}
            className="flex-1 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:bg-brand-accent disabled:opacity-50 disabled:shadow-none"
          >
            {create.isPending ? <CircleNotch weight="bold" className="mx-auto h-4 w-4 animate-spin" /> : "Create Product"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function JoinProjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [code, setCode] = useState("");

  const join = trpc.product.joinByInviteCode.useMutation({
    onSuccess: async (result) => {
      await utils.product.list.invalidate();
      onClose();
      router.push(`/${result.productId}`);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-sf-border-default bg-sf-bg-elevated p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-2">
          <Key weight="duotone" className="h-5 w-5 text-brand-accent" />
          <h3 className="font-display text-xl text-white">Join Project</h3>
        </div>
        <p className="mb-4 text-sm text-sf-text-secondary">Paste the invite code shared by the project owner.</p>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sf-text-secondary">Invite code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD-EFGH-IJKL"
          className="w-full rounded-lg border border-sf-border-subtle bg-sf-bg-base px-3 py-2.5 font-mono text-sm text-sf-text-primary placeholder:text-sf-text-muted transition-all focus:border-sf-border-default focus:outline-none"
        />

        {join.error && (
          <div className="mt-3 rounded-lg border border-sf-accent-rose/20 bg-sf-accent-rose/10 px-3 py-2 text-xs font-medium text-sf-accent-rose">
            {join.error.message}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-sf-border-subtle bg-sf-bg-glass px-4 py-2.5 text-sm font-semibold text-sf-text-secondary transition-all hover:bg-sf-border-subtle hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => join.mutate({ code })}
            disabled={!code.trim() || join.isPending}
            className="flex-1 rounded-lg bg-sf-accent-cyan px-4 py-2.5 text-sm font-bold text-sf-bg-base transition-all hover:bg-[#00e5ff] disabled:opacity-50"
          >
            {join.isPending ? "Joining..." : "Join"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PortfolioPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const { data: products, isLoading } = trpc.product.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-sf-accent-cyan" />
      </div>
    );
  }

  type PortfolioProduct = NonNullable<typeof products>[number];
  const allProducts: PortfolioProduct[] = products ?? [];

  const totalMrr = allProducts.reduce((sum, product) => sum + product.mrr, 0);
  const totalArr = totalMrr * 12;
  const totalUsers = allProducts.reduce((sum, product) => sum + (product.activeUsers ?? 0), 0);
  const avgHealth =
    allProducts.length > 0
      ? Math.round(
          allProducts.reduce((sum, product) => sum + (product.healthScore ?? 0), 0) / allProducts.length,
        )
      : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-white">Portfolio</h1>
          <p className="mt-1 text-sm font-medium text-sf-text-secondary">Command center for your SaaS empire</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="group flex w-fit items-center gap-2 rounded-lg border border-brand-border bg-brand-surface-2 px-4 py-2 text-sm font-bold text-brand-muted transition-all hover:bg-brand-surface hover:text-white focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <Key weight="bold" className="h-4 w-4" /> Join Project
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="group flex w-fit items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all hover:bg-brand-accent focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <Plus weight="bold" className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total MRR",
            value: totalMrr,
            prefix: "$",
            suffix: "",
            icon: ChartBar,
            color: "text-brand-accent",
            bg: "from-brand-accent/10 to-transparent",
            blur: "bg-brand-accent",
          },
          {
            label: "Total ARR",
            value: totalArr,
            prefix: "$",
            suffix: "",
            icon: TrendUp,
            color: "text-emerald-500",
            bg: "from-emerald-500/10 to-transparent",
            blur: "bg-emerald-500",
          },
          {
            label: "Active Users",
            value: totalUsers,
            prefix: "",
            suffix: "",
            icon: Users,
            color: "text-amber-500",
            bg: "from-amber-500/10 to-transparent",
            blur: "bg-amber-500",
          },
          {
            label: "Avg Health",
            value: avgHealth,
            prefix: "",
            suffix: "/100",
            icon: Pulse,
            color: avgHealth >= 75 ? "text-emerald-500" : "text-amber-500",
            bg:
              avgHealth >= 75
                ? "from-emerald-500/10 to-transparent"
                : "from-amber-500/10 to-transparent",
            blur: avgHealth >= 75 ? "bg-emerald-500" : "bg-amber-500",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 + 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="group relative overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-5"
          >
            <div className={`absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-bl ${stat.bg} opacity-50`} />
            <div className={`absolute -right-6 -top-6 h-12 w-12 rounded-full ${stat.blur} opacity-20 blur-xl`} />

            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <stat.icon weight="duotone" className={`h-5 w-5 ${stat.color}`} />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-muted">{stat.label}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-display text-3xl text-white">
                  {stat.prefix}
                  <CountUp end={stat.value} duration={2} separator="," />
                  {stat.suffix && <span className="text-lg text-brand-muted">{stat.suffix}</span>}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {allProducts.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 py-2 sm:flex-row">
          <div className="relative w-full sm:w-[300px]">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-sf-text-muted" size={16} />
            <input
              type="text"
              placeholder="Filter portfolio..."
              className="w-full rounded-lg border border-sf-border-subtle bg-sf-bg-elevated py-2 pl-9 pr-4 text-sm text-sf-text-primary placeholder:text-sf-text-muted transition-all focus:border-sf-border-default focus:outline-none focus:ring-1 focus:ring-sf-accent-cyan"
            />
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-sf-border-subtle bg-sf-bg-elevated px-3 py-2 text-sm font-medium text-sf-text-secondary transition-all hover:border-sf-border-default hover:text-white sm:flex-none">
              <Funnel size={16} /> Filter
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-sf-border-subtle bg-sf-bg-elevated px-3 py-2 text-sm font-medium text-sf-text-secondary transition-all hover:border-sf-border-default hover:text-white sm:flex-none">
              <Faders size={16} /> Sort by: MRR
            </button>
          </div>
        </div>
      )}

      {allProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-sf-border-subtle bg-sf-bg-elevated/50"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-sf-border-subtle bg-sf-bg-glass shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Lightning weight="duotone" className="h-6 w-6 text-sf-text-muted" />
          </div>
          <p className="mb-1 text-base font-bold text-white">No projects yet</p>
          <p className="mb-6 text-sm font-medium text-sf-text-secondary">Create a new project or join one with an invite code.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-2 rounded-lg border border-sf-border-default bg-sf-bg-glass px-4 py-2 text-sm font-bold text-white transition-all hover:bg-sf-border-subtle"
            >
              <Key weight="bold" className="h-4 w-4" /> Join Project
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg border border-sf-border-default bg-sf-bg-glass px-4 py-2 text-sm font-bold text-white transition-all hover:bg-sf-border-subtle"
            >
              <Plus weight="bold" className="h-4 w-4" /> Create Product
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allProducts.map((product) => (
            <Link key={product.id} href={`/${product.id}`} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
              <motion.div
                variants={itemVariants}
                className="group relative overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-5 transition-all hover:-translate-y-1 hover:border-brand-accent hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute right-0 top-0 h-32 w-32 bg-brand-accent opacity-5 blur-[60px]" />
                </div>

                <div className="relative z-10 mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="mb-1 font-display text-xl tracking-tight text-white">{product.name}</h3>
                    {product.website && (
                      <p className="max-w-[180px] truncate text-[11px] font-medium text-sf-text-secondary">{product.website}</p>
                    )}
                  </div>
                  <StatusBadge status={product.status} />
                </div>

                <div className="relative z-10 mt-6 grid grid-cols-2 gap-x-2 gap-y-4 border-t border-sf-border-subtle pt-4">
                  <div>
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-sf-text-muted">MRR</div>
                    <div className="font-mono text-base font-semibold tracking-tight text-white">${formatK(product.mrr)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-sf-text-muted">Users</div>
                    <div className="font-mono text-base font-semibold tracking-tight text-white">{formatK(product.activeUsers)}</div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-text-muted">
                      Health
                      <div className="h-1.5 max-w-[32px] flex-1 overflow-hidden rounded-full bg-sf-bg-base">
                        <div
                          className={`h-full rounded-full ${(product.healthScore ?? 0) >= 75 ? "bg-sf-accent-emerald" : (product.healthScore ?? 0) >= 50 ? "bg-sf-accent-amber" : "bg-sf-accent-rose"}`}
                          style={{ width: `${product.healthScore ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="font-mono text-base font-semibold tracking-tight text-white">
                      {product.healthScore ?? 0}
                      <span className="text-[10px] text-sf-text-muted">/100</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-sf-text-muted">Bugs</div>
                    <div className="font-mono text-base font-semibold tracking-tight text-sf-text-secondary">
                      {(product as any)._count?.issues || 0}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-5 right-5 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border bg-brand-surface-2 shadow-sm">
                    <CaretRight weight="bold" className="h-4 w-4 text-brand-text" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}

      {showCreate && <CreateProductModal onClose={() => setShowCreate(false)} />}
      {showJoin && <JoinProjectModal onClose={() => setShowJoin(false)} />}
    </div>
  );
}
