"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Loader2, RefreshCw, Settings, BarChart3, Users, CreditCard, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc/provider";

const TIME_FILTERS = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "6mo", days: 180 },
  { label: "1yr", days: 365 },
  { label: "All", days: 0 },
] as const;

function formatK(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export default function RevenuePage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const [timeFilter, setTimeFilter] = useState(30);

  const utils = trpc.useUtils();
  const { data: product, isLoading: productLoading } = trpc.product.get.useQuery({ id: productId });
  const { data: integration } = trpc.revenue.getIntegration.useQuery({ productId });

  const dateRange = useMemo(() => {
    if (timeFilter === 0) return {};
    const from = new Date();
    from.setDate(from.getDate() - timeFilter);
    return { from: from.toISOString() };
  }, [timeFilter]);

  const { data: snapshots, isLoading: snapshotsLoading } = trpc.revenue.listSnapshots.useQuery({ productId, ...dateRange });

  const syncNow = trpc.revenue.syncNow.useMutation({
    onSuccess: () => {
      utils.revenue.listSnapshots.invalidate();
      utils.product.get.invalidate({ id: productId });
    },
  });

  if (productLoading || snapshotsLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-sf-text-muted" /></div>;
  }

  if (!integration) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center">
        <CreditCard className="h-12 w-12 text-sf-text-muted/30 mb-4" />
        <h2 className="text-lg font-bold text-sf-text mb-2">Connect your payment provider</h2>
        <p className="text-sm text-sf-text-secondary mb-6 max-w-md">
          Add your Stripe or DodoPayment API key to automatically sync revenue data, track MRR, and monitor subscriptions.
        </p>
        <button onClick={() => router.push(`/${productId}/settings`)} className="flex items-center gap-2 rounded-lg bg-sf-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-sf-accent/90 transition-all shadow-sm">
          <Settings className="h-4 w-4" /> Configure in Settings <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const data = snapshots || [];
  const latest = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;
  const mrrTrend = prev ? ((latest?.mrr || 0) - prev.mrr) / prev.mrr * 100 : 0;
  const usersTrend = prev && prev.users > 0 ? ((latest?.users || 0) - prev.users) / prev.users * 100 : 0;

  const stats = [
    { label: "MRR", value: formatK(product?.mrr || 0), trend: `${mrrTrend >= 0 ? "+" : ""}${mrrTrend.toFixed(1)}%`, up: mrrTrend >= 0, icon: BarChart3 },
    { label: "ARR", value: formatK((product?.mrr || 0) * 12), trend: "12x MRR", up: true, icon: TrendingUp },
    { label: "Active Subscriptions", value: (product?.activeSubscriptions || product?.activeUsers || 0).toString(), trend: `${usersTrend >= 0 ? "+" : ""}${usersTrend.toFixed(1)}%`, up: usersTrend >= 0, icon: Users },
    { label: "Churn Rate", value: `${(product?.churnRate || 0).toFixed(1)}%`, trend: "Target < 5%", up: (product?.churnRate || 0) < 5, icon: TrendingDown },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-sf-text">Revenue & Analytics</h1>
          <p className="text-sm text-sf-text-secondary mt-0.5">
            Synced via {integration.provider === "STRIPE" ? "Stripe" : "DodoPayment"}
            {integration.lastSyncedAt && <span className="text-sf-text-muted"> · Last sync {new Date(integration.lastSyncedAt).toLocaleString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => syncNow.mutate({ productId })}
            disabled={syncNow.isPending}
            className="flex items-center gap-2 rounded-lg border border-sf-border bg-white px-4 py-2 text-sm font-semibold text-sf-text hover:bg-sf-input transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${syncNow.isPending ? "animate-spin" : ""}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Time filters */}
      <div className="flex items-center gap-1 rounded-lg bg-sf-input/60 p-1 w-fit">
        {TIME_FILTERS.map((f: any) => (
          <button
            key={f.label}
            onClick={() => setTimeFilter(f.days)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              timeFilter === f.days ? "bg-white text-sf-text shadow-sm" : "text-sf-text-secondary hover:text-sf-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s: any) => (
          <div key={s.label} className="rounded-xl border border-sf-border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <s.icon className="h-4 w-4 text-sf-text-muted" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-sf-text">{s.value}</div>
            <div className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${s.up ? "text-sf-green" : "text-sf-red"}`}>
              {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {s.trend}
            </div>
          </div>
        ))}
      </div>

      {/* MRR Chart */}
      <div className="rounded-xl border border-sf-border bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-sf-text-muted mb-6">Revenue Performance</h2>
        <div className="flex items-end gap-2 h-48 px-1">
          {data.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-sf-text-muted">
              <BarChart3 className="h-10 w-10 opacity-10 mb-3" />
              <p className="text-sm font-medium">No data for this period</p>
              <p className="text-xs mt-1">Click "Sync Now" to fetch your latest metrics</p>
            </div>
          )}
          {data.map((s: any) => {
            const max = Math.max(...data.map((x: any) => x.mrr), 10);
            const pct = (s.mrr / max) * 100;
            const label = new Date(s.date).toLocaleDateString("en-US", timeFilter <= 7 ? { day: "numeric", month: "short" } : { month: "short" });
            return (
              <div key={s.id} className="group relative flex flex-1 flex-col items-center gap-2">
                <div className="invisible absolute -top-10 rounded-lg bg-sf-text text-white px-2.5 py-1.5 text-[10px] font-mono font-bold shadow-lg group-hover:visible z-10">
                  ${s.mrr.toLocaleString()}
                </div>
                <div className="w-full rounded-t-lg bg-sf-accent/15 transition-all hover:bg-sf-accent/40 cursor-pointer" style={{ height: `${Math.max(pct, 3)}%` }} />
                <span className="text-[9px] font-semibold text-sf-text-muted uppercase">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Snapshot History */}
      <div className="rounded-xl border border-sf-border bg-white overflow-hidden shadow-sm">
        <div className="border-b border-sf-border px-5 py-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sf-text-muted">History</h2>
          <span className="text-[10px] font-semibold text-sf-text-muted bg-sf-input px-2 py-0.5 rounded-full">{data.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sf-border bg-sf-input/30">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sf-text-muted">Date</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sf-text-muted">MRR</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sf-text-muted hidden sm:table-cell">New MRR</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sf-text-muted hidden sm:table-cell">Churned</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sf-text-muted">Subs</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-sf-text-muted hidden md:table-cell">Churn %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border/50">
              {[...data].reverse().map((s: any) => (
                <tr key={s.id} className="hover:bg-sf-input/20 transition-colors">
                  <td className="px-5 py-3 font-medium text-sf-text">{new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-sf-text">${s.mrr.toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-sf-green hidden sm:table-cell">+${(s.newMrr || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-sf-red hidden sm:table-cell">-${(s.churnedMrr || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-sf-text-secondary">{s.activeSubscriptions || s.users}</td>
                  <td className="px-5 py-3 font-mono text-sf-text-secondary hidden md:table-cell">{s.churn.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {syncNow.error && (
        <div className="rounded-xl border border-sf-red/20 bg-sf-red/5 px-5 py-3 text-sm text-sf-red">
          Sync error: {syncNow.error.message}
        </div>
      )}
    </div>
  );
}
