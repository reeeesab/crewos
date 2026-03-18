"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  Copy,
  Globe2,
  Info,
  Loader2,
  PlugZap,
  RefreshCw,
  Sparkles,
  Unplug,
} from "lucide-react";
import { trpc } from "@/lib/trpc/provider";
import { SetupGuide } from "./setup-guide";

type WindowDays = 7 | 30 | 90;
const SIGNUP_EVENT_SNIPPET = `window.gtag?.("event", "sign_up", {
  method: "email",
});`;

function countryFlag(country: string) {
  const flags: Record<string, string> = {
    "United States": "US",
    India: "IN",
    "United Kingdom": "UK",
    Germany: "DE",
    Canada: "CA",
    Australia: "AU",
    France: "FR",
    Brazil: "BR",
    Japan: "JP",
    Netherlands: "NL",
  };
  return flags[country] ?? "GL";
}

function formatSeconds(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function sourceIntentLabel(source: string) {
  const normalized = source.toLowerCase();
  if (normalized.includes("dodo")) return "payment page visitor";
  if (
    normalized.includes("accounts.google.com") ||
    normalized.includes("google.com / referral") ||
    normalized.includes("google / referral")
  ) {
    return "logged-in Google user";
  }
  if (normalized.includes("organic")) return "SEO";
  if (normalized.includes("(direct)") || normalized.startsWith("direct")) return "typed URL / bookmark";
  return "referral / unknown intent";
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass =
    tone === "good" ? "text-sf-accent-emerald" : tone === "warn" ? "text-sf-accent-amber" : "text-sf-text-primary";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sf-border-subtle bg-sf-surface p-5 shadow-lg backdrop-blur-xl">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sf-accent-cyan/5 blur-[45px]" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${toneClass}`}>{value}</p>
    </div>
  );
}

export function AnalyticsPageClient({ productId }: { productId: string }) {
  const utils = trpc.useUtils();
  const [days, setDays] = useState<WindowDays>(30);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formClientEmail, setFormClientEmail] = useState("");
  const [formPrivateKey, setFormPrivateKey] = useState("");
  const [copiedSignupSnippet, setCopiedSignupSnippet] = useState(false);

  const { data: config, isLoading: configLoading } = trpc.analytics.getConfig.useQuery({ productId });
  const isConnected = Boolean(config?.isConnected);

  useEffect(() => {
    if (config?.propertyId && formPropertyId.length === 0) setFormPropertyId(config.propertyId);
    if (config?.clientEmail && formClientEmail.length === 0) setFormClientEmail(config.clientEmail);
  }, [config?.propertyId, config?.clientEmail, formPropertyId.length, formClientEmail.length]);

  const connect = trpc.analytics.connect.useMutation({
    onSuccess: async () => {
      setFormPrivateKey("");
      await Promise.all([
        utils.analytics.getConfig.invalidate({ productId }),
        utils.analytics.getReport.invalidate({ productId, days }),
        utils.analytics.getRealtime.invalidate({ productId }),
      ]);
    },
  });

  const disconnect = trpc.analytics.disconnect.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.analytics.getConfig.invalidate({ productId }),
        utils.analytics.getReport.invalidate({ productId, days }),
        utils.analytics.getRealtime.invalidate({ productId }),
      ]);
    },
  });

  const reportQuery = trpc.analytics.getReport.useQuery(
    { productId, days },
    { enabled: isConnected, staleTime: 60 * 1000, retry: 1 },
  );
  const realtimeQuery = trpc.analytics.getRealtime.useQuery(
    { productId },
    { enabled: isConnected, refetchInterval: 60_000, staleTime: 30_000 },
  );

  const report = reportQuery.data;
  const realtime = realtimeQuery.data;
  const reportError = reportQuery.error?.message;

  const averageHourlyUsers = useMemo(() => {
    if (!report) return 0;
    return report.totalUsers / (days * 24);
  }, [report, days]);

  const trafficSpike = useMemo(() => {
    if (!realtime || averageHourlyUsers < 2) return null;
    if (realtime.totalActive <= averageHourlyUsers * 3) return null;
    return {
      current: realtime.totalActive,
      baseline: Math.max(1, Math.round(averageHourlyUsers)),
      multiple: (realtime.totalActive / averageHourlyUsers).toFixed(1),
    };
  }, [realtime, averageHourlyUsers]);

  if (configLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sf-text-muted" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sf-text-primary">Analytics</h1>
          <p className="mt-1 text-sm text-sf-text-secondary">
            Connect GA4 to unlock founder-focused traffic, conversion, and growth insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSetupGuide((prev) => !prev)}
            className="rounded-lg border border-sf-border-subtle bg-sf-surface px-3 py-1.5 text-xs font-semibold text-sf-text-secondary transition-colors hover:border-sf-border-default hover:text-sf-text-primary"
          >
            {showSetupGuide ? "Hide setup steps" : "How to get credentials"}
          </button>
        </div>

        {showSetupGuide && <SetupGuide />}

        <div className="rounded-2xl border border-sf-border-subtle bg-sf-surface p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-sf-text-secondary">Connect your GA4 property</h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted">
                GA4 Property ID
              </label>
              <input
                value={formPropertyId}
                onChange={(event) => setFormPropertyId(event.target.value)}
                placeholder="123456789"
                className="w-full rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3.5 py-2 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent-cyan focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-sf-text-muted">Found in GA4 Admin → Property Settings.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted">
                Service Account Email
              </label>
              <input
                value={formClientEmail}
                onChange={(event) => setFormClientEmail(event.target.value)}
                placeholder="crewos-analytics@project.iam.gserviceaccount.com"
                className="w-full rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3.5 py-2 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-sf-text-muted">
                Private Key
              </label>
              <textarea
                value={formPrivateKey}
                onChange={(event) => setFormPrivateKey(event.target.value)}
                rows={5}
                placeholder="-----BEGIN PRIVATE KEY-----"
                className="w-full resize-none rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3.5 py-2 font-mono text-xs text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent-cyan focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-sf-text-muted">Paste the full `private_key` value from your JSON file.</p>
            </div>

            {connect.error && (
              <div className="rounded-lg border border-sf-accent-rose/30 bg-sf-accent-rose/10 px-3 py-2 text-xs text-sf-accent-rose">
                {connect.error.message}
              </div>
            )}

            <button
              onClick={() =>
                connect.mutate({
                  productId,
                  propertyId: formPropertyId.trim(),
                  clientEmail: formClientEmail.trim(),
                  privateKey: formPrivateKey,
                })
              }
              disabled={connect.isPending || !formPropertyId || !formClientEmail || !formPrivateKey}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sf-accent-cyan px-4 py-2.5 text-sm font-bold text-sf-bg-base transition-all hover:bg-[#00e5ff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
              {connect.isPending ? "Verifying connection..." : "Connect GA4"}
            </button>

            <p className="flex items-center gap-1.5 text-[11px] text-sf-text-muted">
              <Info className="h-3.5 w-3.5" />
              Credentials are encrypted at rest and only used server-side.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sf-text-primary">Analytics</h1>
          <p className="mt-1 text-sm text-sf-text-secondary">
            Property {config?.propertyId} ·{" "}
            {reportQuery.isFetching
              ? "Syncing..."
              : config?.lastSyncedAt
                ? `Last synced ${new Date(config.lastSyncedAt).toLocaleString()}`
                : "Connected"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30, 90].map((window) => (
            <button
              key={window}
              onClick={() => setDays(window as WindowDays)}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                days === window
                  ? "border-sf-accent-cyan bg-sf-accent-cyan/10 text-sf-accent-cyan"
                  : "border-sf-border-subtle bg-sf-surface text-sf-text-secondary hover:text-sf-text-primary"
              }`}
            >
              {window}d
            </button>
          ))}
          <button
            onClick={() => {
              reportQuery.refetch();
              realtimeQuery.refetch();
            }}
            disabled={reportQuery.isFetching}
            className="inline-flex items-center gap-1.5 rounded-md border border-sf-border-subtle bg-sf-surface px-2.5 py-1 text-xs font-semibold text-sf-text-secondary transition-colors hover:text-sf-text-primary disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reportQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => disconnect.mutate({ productId })}
            disabled={disconnect.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-sf-border-subtle bg-sf-surface px-2.5 py-1 text-xs font-semibold text-sf-text-secondary transition-colors hover:text-sf-text-primary disabled:opacity-50"
          >
            <Unplug className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      </div>

      {reportError && (
        <div className="rounded-xl border border-sf-accent-rose/30 bg-sf-accent-rose/10 px-4 py-3 text-sm text-sf-text-primary">
          <div className="mb-1 font-semibold text-sf-accent-rose">Analytics sync failed</div>
          <p className="text-xs text-sf-text-secondary">{reportError}</p>
        </div>
      )}

      {report?.aiSummary && (
        <div className="rounded-xl border border-sf-accent-violet/30 bg-sf-accent-violet/10 px-4 py-3">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sf-accent-violet">
            <Sparkles className="h-3.5 w-3.5" />
            AI Insight
          </div>
          <p className="text-sm leading-relaxed text-sf-text-primary">{report.aiSummary}</p>
        </div>
      )}

      {realtime && (
        <div className="rounded-xl border border-sf-accent-cyan/25 bg-sf-accent-cyan/10 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-sf-text-primary">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sf-accent-cyan" />
              {realtime.totalActive} active users right now
            </div>
            <div className="flex items-center gap-2 text-[11px] text-sf-text-secondary">
              {realtime.byCountry.slice(0, 3).map((country) => (
                <span key={country.country} className="rounded-full bg-sf-bg-glass px-2 py-0.5">
                  {countryFlag(country.country)} · {country.users}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {trafficSpike && (
        <div className="rounded-xl border border-sf-accent-amber/30 bg-sf-accent-amber/10 px-4 py-3 text-sm text-sf-text-primary">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-sf-accent-amber" />
            Traffic spike detected
          </div>
          <p className="mt-1 text-xs text-sf-text-secondary">
            Live users are {trafficSpike.multiple}x above baseline ({trafficSpike.current} vs avg {trafficSpike.baseline} / hour).
          </p>
        </div>
      )}

      {reportQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-24 animate-pulse rounded-2xl border border-sf-border-subtle bg-sf-surface/60" />
          ))}
        </div>
      ) : report ? (
        <>
          {report.conversionRate === 0 && (
            <div className="rounded-xl border border-sf-accent-amber/35 bg-sf-accent-amber/10 px-4 py-3">
              <p className="text-sm font-semibold text-sf-text-primary">
                No signup events detected. To track conversions, add a GA4 event called `sign_up` to your signup flow.
              </p>
              <div className="mt-3 rounded-lg border border-sf-border-subtle bg-sf-bg-glass p-3">
                <pre className="overflow-x-auto font-mono text-xs text-sf-text-secondary">{SIGNUP_EVENT_SNIPPET}</pre>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(SIGNUP_EVENT_SNIPPET);
                      setCopiedSignupSnippet(true);
                      window.setTimeout(() => setCopiedSignupSnippet(false), 1600);
                    } catch {
                      setCopiedSignupSnippet(false);
                    }
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-sf-border-subtle bg-sf-surface px-2.5 py-1 text-xs font-semibold text-sf-text-secondary transition-colors hover:text-sf-text-primary"
                >
                  {copiedSignupSnippet ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedSignupSnippet ? "Copied" : "Copy gtag snippet"}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="Sessions" value={report.totalSessions.toLocaleString()} />
            <StatCard label="Users" value={report.totalUsers.toLocaleString()} />
            <StatCard label="New users" value={report.newUsers.toLocaleString()} />
            <StatCard
              label="Conversion rate"
              value={`${report.conversionRate.toFixed(1)}%`}
              tone={report.conversionRate < 3 ? "warn" : "good"}
            />
            <StatCard label="Avg engagement" value={formatSeconds(report.avgEngagementTime)} />
            <StatCard
              label="Bounce rate"
              value={`${report.bounceRate.toFixed(1)}%`}
              tone={report.bounceRate <= 45 ? "good" : "warn"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-sf-border-subtle bg-sf-surface p-5 shadow-lg">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sf-text-secondary">
                <Activity className="h-4 w-4 text-sf-accent-cyan" />
                Top Traffic Sources
              </div>
              <div className="space-y-2.5">
                {report.topSources.slice(0, 6).map((source) => (
                  <div key={source.source} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-sf-text-primary">{source.source}</p>
                      <p className="truncate text-[10px] uppercase tracking-wider text-sf-text-muted">
                        {sourceIntentLabel(source.source)}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-sf-text-secondary">{source.sessions}</span>
                    {source.converting && (
                      <span className="rounded bg-sf-accent-emerald/20 px-1.5 py-0.5 text-[10px] font-semibold text-sf-accent-emerald">
                        converting
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-sf-border-subtle bg-sf-surface p-5 shadow-lg">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sf-text-secondary">
                <Globe2 className="h-4 w-4 text-sf-accent-cyan" />
                Top Pages
              </div>
              <div className="space-y-2.5">
                {report.topPages.slice(0, 6).map((page) => (
                  <div key={page.page} className="flex items-center gap-2">
                    <p className="flex-1 truncate font-mono text-xs text-sf-text-secondary">
                      {page.page === "(entrance)" ? "/" : page.page}
                    </p>
                    <span className="font-mono text-xs text-sf-text-primary">{page.conversionRate.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-sf-border-subtle bg-sf-surface p-5 shadow-lg">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sf-text-secondary">
                <Activity className="h-4 w-4 text-sf-accent-cyan" />
                Users By Country
              </div>
              <div className="space-y-2.5">
                {report.topCountries.slice(0, 6).map((country) => (
                  <div key={country.country} className="flex items-center gap-2">
                    <span className="rounded bg-sf-bg-glass px-1.5 py-0.5 text-[10px] font-bold text-sf-text-secondary">
                      {countryFlag(country.country)}
                    </span>
                    <p className="flex-1 truncate text-xs text-sf-text-primary">{country.country}</p>
                    <span className="font-mono text-xs text-sf-text-secondary">{country.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-sf-border-subtle bg-sf-surface p-5 shadow-lg">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-sf-text-secondary">New vs Returning Users</div>
            <div className="mb-4 flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-sf-text-primary">{report.newUsers.toLocaleString()}</p>
                <p className="text-xs text-sf-text-muted">new</p>
              </div>
              <div className="text-xs text-sf-text-muted">vs</div>
              <div>
                <p className="text-2xl font-bold text-sf-text-primary">{report.returningUsers.toLocaleString()}</p>
                <p className="text-xs text-sf-text-muted">returning</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-bold text-sf-accent-emerald">
                  {report.totalUsers > 0 ? Math.round((report.returningUsers / report.totalUsers) * 100) : 0}%
                </p>
                <p className="text-xs text-sf-text-muted">returning share</p>
              </div>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-sf-base">
              <div
                className="bg-sf-accent-cyan"
                style={{ width: `${report.totalUsers > 0 ? (report.newUsers / report.totalUsers) * 100 : 0}%` }}
              />
              <div className="flex-1 bg-sf-accent-emerald" />
            </div>
          </div>
        </>
      ) : reportError ? (
        <div className="rounded-2xl border border-sf-accent-rose/30 bg-sf-surface p-10 text-center text-sm text-sf-text-secondary">
          Could not fetch analytics from GA4 right now. Check access and click Refresh.
        </div>
      ) : (
        <div className="rounded-2xl border border-sf-border-subtle bg-sf-surface p-10 text-center text-sm text-sf-text-secondary">
          No analytics data returned yet for this property. If this is a new GA4 setup, wait a minute and click Refresh.
        </div>
      )}
    </div>
  );
}
