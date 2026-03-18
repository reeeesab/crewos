"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Loader2,
  RefreshCw,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { trpc } from "@/lib/trpc/provider";
import { cn } from "@/lib/utils";

const TIME_FILTERS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "6mo", days: 180 },
  { label: "1yr", days: 365 },
  { label: "All", days: 0 },
] as const;

const CHART_METRICS = ["MRR", "New MRR", "Churned", "Subs"] as const;

type ChartMetric = (typeof CHART_METRICS)[number];

type ChartRow = {
  id: string;
  label: string;
  dateLabel: string;
  mrr: number;
  newMrr: number;
  churnedMrr: number;
  subs: number;
  churnPct: number;
};

function formatCurrency(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString()}`;
  }
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function formatDate(date: Date | string, timeFilter: number) {
  return new Date(date).toLocaleDateString(
    "en-US",
    timeFilter <= 7 ? { day: "numeric", month: "short" } : { month: "short", day: "numeric" },
  );
}

function slugifyMetric(metric: ChartMetric) {
  return metric.toLowerCase().replace(/\s+/g, "-");
}

export default function RevenuePage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [timeFilter, setTimeFilter] = useState<number>(30);
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("MRR");
  const [syncState, setSyncState] = useState<"idle" | "success" | "error">("idle");

  const utils = trpc.useUtils();
  const { data: product, isLoading: productLoading } = trpc.product.get.useQuery({ id: productId });
  const { data: integration } = trpc.revenue.getIntegration.useQuery({ productId });
  const { data: dunningSummary, isLoading: dunningLoading } = trpc.revenue.getDunningSummary.useQuery({ productId });

  const dateRange = useMemo(() => {
    if (timeFilter === 0) return {};
    const from = new Date();
    from.setDate(from.getDate() - timeFilter);
    return { from: from.toISOString() };
  }, [timeFilter]);

  const { data: snapshots, isLoading: snapshotsLoading } = trpc.revenue.listSnapshots.useQuery({
    productId,
    ...dateRange,
  });

  const syncNow = trpc.revenue.syncNow.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.revenue.listSnapshots.invalidate(),
        utils.product.get.invalidate({ id: productId }),
        utils.revenue.getIntegration.invalidate({ productId }),
        utils.revenue.getDunningSummary.invalidate({ productId }),
      ]);
      setSyncState("success");
    },
    onError: () => {
      setSyncState("error");
    },
  });

  useEffect(() => {
    if (syncState === "idle") return;
    const timer = window.setTimeout(() => setSyncState("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [syncState]);

  if (productLoading || snapshotsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#94a3b8]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] p-4 text-sm text-[#ef4444]">
        Product not found.
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-[rgba(14,165,233,0.15)] bg-[#0a1525] px-6 text-center">
        <CreditCard className="mb-4 h-12 w-12 text-[#334155]" />
        <h2 className="mb-2 text-lg font-semibold text-[#f1f5f9]">Connect your payment provider</h2>
        <p className="mb-6 max-w-md text-sm text-[#94a3b8]">
          Add your Stripe or DodoPayment API key to sync revenue history, track MRR, and unlock customer analytics.
        </p>
        <button
          onClick={() => router.push(`/${productId}/settings`)}
          className="inline-flex items-center gap-2 rounded-lg border border-[rgba(14,165,233,0.25)] bg-[rgba(14,165,233,0.08)] px-5 py-2.5 text-sm font-semibold text-[#0ea5e9] transition hover:bg-[rgba(14,165,233,0.14)]"
        >
          <Settings className="h-4 w-4" />
          Configure in Settings
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const data = snapshots ?? [];
  const latest = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;

  const mrrTrend = prev && prev.mrr > 0 ? (((latest?.mrr ?? 0) - prev.mrr) / prev.mrr) * 100 : 0;
  const subsTrend =
    prev && (prev.activeSubscriptions || prev.users) > 0
      ? ((((latest?.activeSubscriptions || latest?.users || 0) - (prev.activeSubscriptions || prev.users)) /
          (prev.activeSubscriptions || prev.users)) *
          100)
      : 0;

  const chartRows: ChartRow[] = data.map((row) => ({
    id: row.id,
    label: formatDate(row.date, timeFilter),
    dateLabel: new Date(row.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    mrr: row.mrr,
    newMrr: row.newMrr || 0,
    churnedMrr: row.churnedMrr || 0,
    subs: row.activeSubscriptions || row.users || 0,
    churnPct: row.churn || 0,
  }));

  const historyRows = [...data]
    .map((row, index, arr) => {
      const previous = index > 0 ? arr[index - 1] : null;
      const mrrDeltaPct = previous && previous.mrr > 0 ? ((row.mrr - previous.mrr) / previous.mrr) * 100 : 0;
      return {
        id: row.id,
        dateLabel: new Date(row.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        mrr: row.mrr,
        newMrr: row.newMrr || 0,
        churnedMrr: row.churnedMrr || 0,
        subs: row.activeSubscriptions || row.users || 0,
        churnPct: row.churn || 0,
        mrrDeltaPct,
      };
    })
    .reverse();

  const metricConfig = {
    MRR: { key: "mrr", color: "#0ea5e9", currency: true },
    "New MRR": { key: "newMrr", color: "#2dd4bf", currency: true },
    Churned: { key: "churnedMrr", color: "#ef4444", currency: true },
    Subs: { key: "subs", color: "#0ea5e9", currency: false },
  } as const;

  const currentMetric = metricConfig[activeMetric];
  const gradientId = `${slugifyMetric(activeMetric)}-gradient`;

  const customers = (dunningSummary?.recentAttempts ?? []).slice(0, 4).map((attempt) => {
    const localPart = attempt.customerEmail.split("@")[0] || "Unknown";
    const name = localPart
      .split(/[._-]/g)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");

    return {
      id: attempt.id,
      name: name || "Unknown",
      email: attempt.customerEmail,
      plan: "Subscription",
      amount: attempt.amountCents / 100,
      currency: attempt.currency || "USD",
      since: new Date(attempt.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: attempt.status === "FAILED" ? "inactive" : "active",
    };
  });

  const activeCount = customers.filter((customer) => customer.status === "active").length;
  const churn = product.churnRate || 0;

  return (
    <div className="space-y-6">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[#f1f5f9]">Revenue & Analytics</h1>
          <p className="mt-1 flex items-center gap-2 text-xs font-mono text-[#334155]">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3ecf8e]" />
              Synced via {integration.provider === "STRIPE" ? "Stripe" : "DodoPayment"}
            </span>
            <span className="text-[#1e3a5f]">·</span>
            <span>
              Last sync{" "}
              {integration.lastSyncedAt
                ? new Date(integration.lastSyncedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "not yet"}
            </span>
          </p>
        </div>

        <button
          onClick={() => {
            setSyncState("idle");
            syncNow.mutate({ productId });
          }}
          disabled={syncNow.isPending}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-mono transition-all",
            syncNow.isPending
              ? "border-[rgba(14,165,233,0.2)] bg-[rgba(14,165,233,0.05)] text-[#0ea5e9]"
              : syncState === "success"
                ? "border-[rgba(62,207,142,0.3)] bg-[rgba(62,207,142,0.05)] text-[#3ecf8e]"
                : syncState === "error"
                  ? "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] text-[#ef4444]"
                  : "border-[rgba(14,165,233,0.15)] text-[#475569] hover:border-[rgba(14,165,233,0.25)] hover:text-[#94a3b8]",
          )}
        >
          {syncNow.isPending ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Syncing...
            </>
          ) : syncState === "success" ? (
            <>✓ Synced</>
          ) : syncState === "error" ? (
            <>✗ Failed — retry</>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Sync Now
            </>
          )}
        </button>
      </div>

      <div className="flex w-fit gap-1 rounded-lg border border-[rgba(14,165,233,0.1)] bg-[#0a1525] p-1">
        {TIME_FILTERS.map((period) => (
          <button
            key={period.label}
            onClick={() => setTimeFilter(period.days)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-mono transition-all",
              timeFilter === period.days
                ? "bg-[#0ea5e9] text-white"
                : "text-[#475569] hover:text-[#94a3b8]",
            )}
          >
            {period.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-[rgba(14,165,233,0.15)] bg-[#0f1e35] p-5">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#0ea5e9]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#475569]">MRR</span>
          </div>
          <div className={cn("text-3xl font-mono font-semibold tracking-tight", (product.mrr || 0) > 0 ? "text-[#3ecf8e]" : "text-[#94a3b8]")}>{formatCompactCurrency(product.mrr || 0)}</div>
          <div className={cn("mt-1 flex items-center gap-1 text-xs font-mono", mrrTrend >= 0 ? "text-[#3ecf8e]" : "text-[#ef4444]")}>
            {mrrTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {`${mrrTrend >= 0 ? "+" : ""}${mrrTrend.toFixed(1)}% this period`}
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(14,165,233,0.15)] bg-[#0f1e35] p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#2dd4bf]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#475569]">ARR</span>
          </div>
          <div className={cn("text-3xl font-mono font-semibold tracking-tight", (product.mrr || 0) > 0 ? "text-[#3ecf8e]" : "text-[#94a3b8]")}>{formatCompactCurrency((product.mrr || 0) * 12)}</div>
          <div className="mt-1 text-xs font-mono text-[#475569]">12x monthly recurring revenue</div>
        </div>

        <div className="rounded-xl border border-[rgba(14,165,233,0.15)] bg-[#0f1e35] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#0ea5e9]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#475569]">Active Subscriptions</span>
          </div>
          <div className="text-3xl font-mono font-semibold tracking-tight text-[#0ea5e9]">
            {(product.activeSubscriptions || product.activeUsers || 0).toLocaleString()}
          </div>
          <div className={cn("mt-1 flex items-center gap-1 text-xs font-mono", subsTrend >= 0 ? "text-[#3ecf8e]" : "text-[#ef4444]")}>
            {subsTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {`${subsTrend >= 0 ? "+" : ""}${subsTrend.toFixed(1)}% this period`}
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(14,165,233,0.15)] bg-[#0f1e35] p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-[#f97316]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#475569]">Churn Rate</span>
          </div>
          <div
            className={cn(
              "text-3xl font-mono font-semibold tracking-tight",
              churn < 3 ? "text-[#3ecf8e]" : churn <= 7 ? "text-[#f97316]" : "text-red-400",
            )}
          >
            {churn.toFixed(1)}%
          </div>
          <div className="mt-1 text-xs font-mono text-[#475569]">Healthy target below 3%</div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(14,165,233,0.15)] bg-[#0a1525] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#475569]">Revenue Performance</span>
          <div className="flex gap-1 rounded-lg border border-[rgba(14,165,233,0.08)] bg-[#070c17] p-1">
            {CHART_METRICS.map((metric) => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-mono transition-all",
                  activeMetric === metric
                    ? "border border-[rgba(14,165,233,0.2)] bg-[#0f1e35] text-[#0ea5e9]"
                    : "text-[#334155] hover:text-[#475569]",
                )}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>

        {chartRows.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartRows}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#334155", fontSize: 10, fontFamily: "var(--font-mono)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#334155", fontSize: 10, fontFamily: "var(--font-mono)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) =>
                    currentMetric.currency ? formatCompactCurrency(value) : value.toLocaleString()
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f1e35",
                    border: "1px solid rgba(14,165,233,0.2)",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    fontSize: "12px",
                    fontFamily: "var(--font-mono)",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(value) =>
                    currentMetric.currency
                      ? [formatCurrency(Number(value ?? 0)), activeMetric]
                      : [Number(value ?? 0).toLocaleString(), activeMetric]
                  }
                />
                <Area
                  type="monotone"
                  dataKey={currentMetric.key}
                  stroke={currentMetric.color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <div className="flex items-end gap-1 opacity-10">
              {[40, 55, 48, 62, 58, 70, 65, 80, 75, 90, 85, 95].map((height, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="w-6 rounded-t bg-[#0ea5e9]"
                  style={{ height: `${height * 0.6}px` }}
                />
              ))}
            </div>
            <p className="text-center text-xs font-mono text-[#334155]">
              No revenue history yet
              <br />
              <span className="text-[#1e3a5f]">Data appears after your first real payment</span>
            </p>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[rgba(14,165,233,0.15)] bg-[#0a1525]">
        <div className="flex items-center justify-between border-b border-[rgba(14,165,233,0.08)] px-5 py-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[#475569]">History</span>
          <span className="text-xs font-mono text-[#334155]">{historyRows.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(14,165,233,0.06)]">
                {["Date", "MRR", "New MRR", "Churned", "Subs", "Churn %"].map((column) => (
                  <th
                    key={column}
                    className="px-5 py-3 text-left text-xs font-mono font-medium uppercase tracking-widest text-[#334155]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs font-mono text-[#1e3a5f]">
                    No history yet — appears after first payment event
                  </td>
                </tr>
              ) : (
                historyRows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-[rgba(14,165,233,0.04)] transition-colors hover:bg-[rgba(14,165,233,0.03)]",
                      row.mrrDeltaPct > 20 && "bg-[rgba(62,207,142,0.03)]",
                      row.mrrDeltaPct < -10 && "bg-[rgba(239,68,68,0.03)]",
                    )}
                  >
                    <td className="px-5 py-3 text-xs font-mono text-[#475569]">{row.dateLabel}</td>
                    <td
                      className={cn(
                        "px-5 py-3 text-sm font-mono font-medium",
                        row.mrr > 0 ? "text-[#3ecf8e]" : "text-[#94a3b8]",
                      )}
                    >
                      {formatCurrency(row.mrr)}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-[#3ecf8e]">+{formatCurrency(row.newMrr)}</td>
                    <td className="px-5 py-3 text-xs font-mono text-[#ef4444]">-{formatCurrency(row.churnedMrr)}</td>
                    <td className="px-5 py-3 text-xs font-mono text-[#0ea5e9]">{row.subs.toLocaleString()}</td>
                    <td
                      className={cn(
                        "px-5 py-3 text-xs font-mono",
                        row.churnPct > 5
                          ? "text-[#ef4444]"
                          : row.churnPct > 2
                            ? "text-[#f97316]"
                            : "text-[#3ecf8e]",
                      )}
                    >
                      {row.churnPct.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[rgba(14,165,233,0.15)] bg-[#0a1525]">
        <div className="flex items-center justify-between border-b border-[rgba(14,165,233,0.08)] px-5 py-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[#475569]">Customers</span>
          <span className="text-xs font-mono text-[#0ea5e9]">{activeCount} active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(14,165,233,0.06)]">
                {["Customer", "Plan", "Amount", "Since", "Status"].map((column) => (
                  <th
                    key={column}
                    className="px-5 py-3 text-left text-xs font-mono font-medium uppercase tracking-widest text-[#334155]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dunningLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-xs font-mono text-[#334155]">
                    Loading customer preview...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-xs font-mono text-[#1e3a5f]">
                    No customer records available yet
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-[rgba(14,165,233,0.04)] transition-colors hover:bg-[rgba(14,165,233,0.03)]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(14,165,233,0.15)] text-xs font-semibold text-[#0ea5e9]">
                          {customer.name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#f1f5f9]">{customer.name}</p>
                          <p className="text-xs font-mono text-[#334155]">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-[#94a3b8]">{customer.plan}</td>
                    <td className="px-5 py-3 text-xs font-mono text-[#3ecf8e]">
                      {customer.amount === 0 ? (
                        <span className="text-[#334155]">100% off</span>
                      ) : (
                        formatCurrency(customer.amount, customer.currency)
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-[#475569]">{customer.since}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-mono",
                          customer.status === "active"
                            ? "bg-[rgba(62,207,142,0.1)] text-[#3ecf8e]"
                            : "bg-[rgba(239,68,68,0.1)] text-[#ef4444]",
                        )}
                      >
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
