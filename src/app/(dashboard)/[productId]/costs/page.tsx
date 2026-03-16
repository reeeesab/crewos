"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Plus, AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/provider";

type CostCategory = "LLM" | "CLOUD" | "PAYMENTS" | "EMAIL" | "TOOLING" | "OTHER";

const CATEGORY_COLORS: Record<string, string> = {
  LLM: "bg-sf-purple",
  CLOUD: "bg-sf-teal",
  PAYMENTS: "bg-sf-green",
  EMAIL: "bg-sf-accent",
  TOOLING: "bg-sf-amber",
  OTHER: "bg-sf-text-muted",
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  LLM: "text-sf-purple",
  CLOUD: "text-sf-teal",
  PAYMENTS: "text-sf-green",
  EMAIL: "text-sf-accent",
  TOOLING: "text-sf-amber",
  OTHER: "text-sf-text-muted",
};

function formatMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

export default function CostsPage() {
  const params = useParams();
  const productId = params.productId as string;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "OTHER" as CostCategory,
    amount: "",
    budget: "",
    billingCycle: "monthly",
    vendor: "",
    issueId: ""
  });

  const utils = trpc.useUtils();
  const { data: costsList, isLoading } = trpc.cost.list.useQuery({ productId });
  const { data: product } = trpc.product.get.useQuery({ id: productId });

  const createCost = trpc.cost.create.useMutation({
    onSuccess: () => {
      utils.cost.list.invalidate({ productId });
      setShowForm(false);
      setForm({ name: "", category: "OTHER", amount: "", budget: "", billingCycle: "monthly", vendor: "", issueId: "" });
    }
  });

  const { data: issues } = trpc.issue.list.useQuery({ productId });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sf-text-muted" />
      </div>
    );
  }

  const costs = costsList ?? [];
  const total = costs.reduce((s: any, c: any) => s + c.amount, 0);
  const llmTotal = costs.filter((c: any) => c.category === "LLM").reduce((s: any, c: any) => s + c.amount, 0);
  const cloudTotal = costs.filter((c: any) => c.category === "CLOUD").reduce((s: any, c: any) => s + c.amount, 0);
  
  const activeUsers = product?.activeUsers ?? 1;
  const costPerUser = (total / activeUsers).toFixed(2);

  const overBudget = costs.filter((c) => c.budget && c.amount > c.budget);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sf-text-primary">Cost Tracker</h1>
          <p className="text-sm text-sf-text-secondary mt-1">Infrastructure, LLM, and Tooling Expenses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-sf-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sf-accent/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add cost
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Monthly", value: formatMoney(total), color: "text-sf-text" },
          { label: "LLM Costs", value: formatMoney(llmTotal), color: "text-sf-purple" },
          { label: "Cloud Infra", value: formatMoney(cloudTotal), color: "text-sf-teal" },
          { label: "Cost per User", value: `$${costPerUser}`, color: "text-sf-text" },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl border border-sf-border-subtle bg-sf-surface p-5 shadow-lg backdrop-blur-xl transition-all hover:border-sf-border-default">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sf-accent/5 blur-[50px]"></div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted">{s.label}</div>
            <div className={`mt-2 text-2xl font-bold tracking-tight ${s.color === "text-sf-text" ? "text-sf-text-primary" : s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Overage alerts */}
      {overBudget.length > 0 && (
        <div className="rounded-lg border border-sf-amber/20 bg-sf-amber/5 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-sf-amber" />
            <span className="text-xs font-medium text-sf-amber">Budget exceeded on {overBudget.length} line item{overBudget.length > 1 ? "s" : ""}</span>
          </div>
          {overBudget.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-xs">
              <span className="text-sf-text-secondary">{c.name}</span>
              <span className="font-mono text-sf-red">
                ${c.amount} / ${c.budget} budget (+${c.amount - (c.budget ?? 0)})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cost breakdown bars */}
      <div className="relative overflow-hidden rounded-2xl border border-sf-border-subtle bg-sf-surface p-6 shadow-lg backdrop-blur-xl">
        <div className="mb-6 font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary">
          Cost Breakdown
        </div>
        <div className="space-y-3">
          {costs.length === 0 && (
            <div className="py-8 text-center text-xs text-sf-text-muted">No costs tracked for this product.</div>
          )}
          {costs.map((cost) => {
            const pct = total > 0 ? (cost.amount / total) * 100 : 0;
            const budgetPct = cost.budget ? (cost.amount / cost.budget) * 100 : 0;
            const isOver = cost.budget && cost.amount > cost.budget;
            return (
              <div key={cost.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[9px] font-medium rounded px-1 py-0.5 ${CATEGORY_TEXT_COLORS[cost.category]} bg-current/10`}
                      style={{ backgroundColor: `${CATEGORY_TEXT_COLORS[cost.category]}15` }}>
                      {cost.category}
                    </span>
                    <span className="text-sm font-medium text-sf-text-primary">{cost.name}</span>
                    {cost.source !== "MANUAL" && (
                      <span className="flex items-center gap-1 rounded bg-sf-accent/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-sf-accent">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        AUTOMATED
                      </span>
                    )}
                    {cost.issue && (
                      <span className="rounded bg-sf-purple/10 px-1 py-0.5 font-mono text-[9px] font-bold text-sf-purple">
                        FEATURE: {cost.issue.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`font-mono text-sm font-bold ${isOver ? "text-sf-red" : "text-sf-text-primary"}`}>
                      {formatMoney(cost.amount)}
                    </span>
                    {cost.budget && (
                      <span className="font-mono text-xs text-sf-text-muted">/ {formatMoney(cost.budget)}</span>
                    )}
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-sf-base overflow-hidden border border-sf-border-subtle/30 shadow-inner">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[cost.category]} transition-all shadow-[0_0_10px_rgba(var(--color-sf-accent-rgb),0.5)]`}
                    style={{ width: `${Math.min(pct * 5, 100)}%` }}
                  />
                </div>
                {cost.budget && (
                  <div className="h-1.5 w-full rounded-full bg-sf-base overflow-hidden border border-sf-border-subtle/30 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all shadow-sm ${budgetPct > 100 ? "bg-sf-red" : budgetPct > 90 ? "bg-sf-amber" : "bg-sf-green"}`}
                      style={{ width: `${Math.min(budgetPct, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add cost modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080B12]/80 backdrop-blur-md p-4 transition-all">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              createCost.mutate({
                productId,
                name: form.name,
                category: form.category,
                amount: parseFloat(form.amount),
                budget: form.budget ? parseFloat(form.budget) : undefined,
                billingCycle: form.billingCycle as any,
                vendor: form.vendor,
                issueId: form.issueId || undefined
              });
            }}
            className="w-full max-w-md rounded-2xl border border-sf-border-subtle bg-sf-elevated p-7 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-sf-text-primary mb-6">Add Cost Line</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted mb-1.5">Name</label>
                <input 
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all" 
                  placeholder='e.g. "OpenAI GPT-4o"' 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted mb-1.5">Category</label>
                  <select 
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as CostCategory })}
                    className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all appearance-none"
                  >
                    {["LLM", "CLOUD", "PAYMENTS", "EMAIL", "TOOLING", "OTHER"].map((c) => (
                      <option key={c} value={c} className="bg-sf-elevated">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted mb-1.5">Billing Cycle</label>
                  <select 
                    value={form.billingCycle}
                    onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                    className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all appearance-none"
                  >
                    <option value="monthly" className="bg-sf-elevated">monthly</option>
                    <option value="annual" className="bg-sf-elevated">annual</option>
                    <option value="usage" className="bg-sf-elevated">usage</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted mb-1.5">Amount ($)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm font-mono text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all" 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted mb-1.5">Budget ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm font-mono text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted mb-1.5">Vendor (Optional)</label>
                  <input 
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all" 
                    placeholder="e.g. AWS" 
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted mb-1.5">Associate Feature</label>
                  <select 
                    value={form.issueId}
                    onChange={(e) => setForm({ ...form, issueId: e.target.value })}
                    className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all appearance-none"
                  >
                    <option value="" className="bg-sf-elevated">None</option>
                    {issues?.map((issue) => (
                      <option key={issue.id} value={issue.id} className="bg-sf-elevated">
                        {issue.type === "BUG" ? "🐛" : "✨"} {issue.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {createCost.error && (
              <div className="mt-3 flex items-center gap-2 rounded bg-sf-red/10 p-2 text-[10px] text-sf-red">
                <AlertCircle className="h-3 w-3" />
                {createCost.error.message}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button 
                type="button"
                onClick={() => setShowForm(false)} 
                className="flex-1 rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm font-semibold text-sf-text-secondary hover:text-sf-text-primary hover:bg-sf-border-subtle transition-all"
                >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={createCost.isPending}
                className="flex-1 rounded-xl bg-sf-accent px-4 py-2.5 text-sm font-bold tracking-tight text-white hover:bg-sf-accent/90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(var(--color-sf-accent-rgb),0.3)]"
              >
                {createCost.isPending ? "Adding..." : "Add Cost Line"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
