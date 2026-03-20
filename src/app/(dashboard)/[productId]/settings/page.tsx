"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Trash2,
  Save,
  AlertTriangle,
  Key,
  Shield,
  Copy,
  Mail,
  Link as LinkIcon,
  Bell,
  CheckCircle2,
  AlertCircle,
  Circle,
  FlaskConical,
  Eye,
} from "lucide-react";
import { trpc } from "@/lib/trpc/provider";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const utils = trpc.useUtils();
  const { data: product, isLoading } = trpc.product.get.useQuery({ id: productId });
  const { data: integration } = trpc.revenue.getIntegration.useQuery({ productId });
  const { data: dunningSummary } = trpc.revenue.getDunningSummary.useQuery({ productId });
  const { data: analyticsConfig } = trpc.analytics.getConfig.useQuery({ productId });
  const { data: notificationPrefs } = trpc.notifications.getPreferences.useQuery({ productId });
  const { data: stripeWebhookEvents } = trpc.revenue.listWebhookEvents.useQuery({ productId, provider: "STRIPE", limit: 5 });
  const { data: dodoWebhookEvents } = trpc.revenue.listWebhookEvents.useQuery({ productId, provider: "DODO_PAYMENTS", limit: 5 });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("general");
  const [form, setForm] = useState<any>(null);
  const [copiedItem, setCopiedItem] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [stripeTestResult, setStripeTestResult] = useState("");
  const [dodoTestResult, setDodoTestResult] = useState("");
  const [integrationForm, setIntegrationForm] = useState({
    provider: "STRIPE" as "STRIPE" | "DODO_PAYMENTS",
    stripeApiKey: "",
    dodoApiKey: ""
  });
  const [notificationsForm, setNotificationsForm] = useState({
    paymentFailedEnabled: true,
    healthScoreEnabled: true,
    healthScoreThreshold: 60,
    trafficSpikeEnabled: true,
    issueOverdueEnabled: true,
    weeklyDigestEnabled: true,
    weeklyDigestDay: 1,
    weeklyDigestTime: "08:00",
  });
  const [dunningForm, setDunningForm] = useState({
    dunningEnabled: false,
    dunningFromEmail: "",
    dunningSenderName: "Indiqo",
    dunningReplyTo: "",
    stripeWebhookSecret: "",
    dodoWebhookSecret: "",
    dunningEmail1Subject: "",
    dunningEmail1Body: "",
    dunningEmail2Subject: "",
    dunningEmail2Body: "",
    dunningEmail3Subject: "",
    dunningEmail3Body: "",
  });
  const [integrationSaved, setIntegrationSaved] = useState(false);
  const [dunningSaved, setDunningSaved] = useState(false);
  const [notificationsSaved, setNotificationsSaved] = useState(false);

  // Initialize forms when data loads
  if (product && !form) {
    setForm({ name: product.name, description: product.description || "", website: product.website || "", status: product.status });
  }

  // Use a ref flag to only initialize integration form once from server data
  const [integrationInitialized, setIntegrationInitialized] = useState(false);
  if (integration && !integrationInitialized) {
    setIntegrationInitialized(true);
    setIntegrationForm({
      provider: integration.provider as any,
      stripeApiKey: integration.stripeApiKey || "",
      dodoApiKey: integration.dodoApiKey || ""
    });
  }

  const [dunningInitialized, setDunningInitialized] = useState(false);
  if (dunningSummary?.integration && !dunningInitialized) {
    setDunningInitialized(true);
    setDunningForm({
      dunningEnabled: dunningSummary.integration.dunningEnabled || false,
      dunningFromEmail: dunningSummary.integration.dunningFromEmail || "",
      dunningSenderName: dunningSummary.integration.dunningSenderName || "Indiqo",
      dunningReplyTo: dunningSummary.integration.dunningReplyTo || "",
      stripeWebhookSecret: dunningSummary.integration.stripeWebhookSecret || "",
      dodoWebhookSecret: dunningSummary.integration.dodoWebhookSecret || "",
      dunningEmail1Subject: dunningSummary.integration.dunningEmail1Subject || "Payment failed — quick fix inside",
      dunningEmail1Body:
        dunningSummary.integration.dunningEmail1Body ||
        "Your payment of {{amount}} for {{productName}} didn't go through. This is usually a card expiration or bank-side block. Update your billing method and we'll retry automatically.",
      dunningEmail2Subject: dunningSummary.integration.dunningEmail2Subject || "Your access is at risk (payment retry pending)",
      dunningEmail2Body:
        dunningSummary.integration.dunningEmail2Body ||
        "Still unpaid: {{amount}} for {{productName}}. You're at risk of service interruption. A quick payment method update usually resolves this in under a minute.",
      dunningEmail3Subject: dunningSummary.integration.dunningEmail3Subject || "Final reminder: update payment method",
      dunningEmail3Body:
        dunningSummary.integration.dunningEmail3Body ||
        "Final reminder: {{productName}} billing issue is still open. This is the last recovery email from Indiqo before this invoice is marked unresolved. Update your card to avoid disruption.",
    });
  }

  const [notificationsInitialized, setNotificationsInitialized] = useState(false);
  if (notificationPrefs && !notificationsInitialized) {
    setNotificationsInitialized(true);
    setNotificationsForm({
      paymentFailedEnabled: notificationPrefs.paymentFailedEnabled,
      healthScoreEnabled: notificationPrefs.healthScoreEnabled,
      healthScoreThreshold: notificationPrefs.healthScoreThreshold,
      trafficSpikeEnabled: notificationPrefs.trafficSpikeEnabled,
      issueOverdueEnabled: notificationPrefs.issueOverdueEnabled,
      weeklyDigestEnabled: notificationPrefs.weeklyDigestEnabled,
      weeklyDigestDay: notificationPrefs.weeklyDigestDay,
      weeklyDigestTime: notificationPrefs.weeklyDigestTime,
    });
  }

  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => { utils.product.get.invalidate({ id: productId }); utils.product.list.invalidate(); }
  });

  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => { router.push("/portfolio"); }
  });

  const updateIntegration = trpc.revenue.updateIntegration.useMutation({
    onSuccess: () => { 
      utils.revenue.getIntegration.invalidate({ productId });
      utils.revenue.getDunningSummary.invalidate({ productId });
      setIntegrationSaved(true);
      setTimeout(() => setIntegrationSaved(false), 3000);
    }
  });

  const updateDunning = trpc.revenue.updateDunningConfig.useMutation({
    onSuccess: () => {
      utils.revenue.getDunningSummary.invalidate({ productId });
      setDunningSaved(true);
      setTimeout(() => setDunningSaved(false), 3000);
    },
  });

  const updateNotifications = trpc.notifications.updatePreferences.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.notifications.getPreferences.invalidate({ productId }),
        utils.notifications.getUnreadCount.invalidate({ productId }),
      ]);
      setNotificationsSaved(true);
      setTimeout(() => setNotificationsSaved(false), 3000);
    },
  });

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripeWebhookUrl = `${appUrl}/api/webhooks/stripe?productId=${productId}`;
  const dodoWebhookUrl = `${appUrl}/api/webhooks/dodopayments?productId=${productId}${
    dunningForm.dodoWebhookSecret ? `&token=${encodeURIComponent(dunningForm.dodoWebhookSecret)}` : ""
  }`;
  const recoveredUsd = ((dunningSummary?.recoveredThisMonthCents || 0) / 100);
  const assumedPlanUsd = 29;
  const roiMultiple = recoveredUsd > 0 ? recoveredUsd / assumedPlanUsd : 0;

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(""), 1600);
    } catch {
      setCopiedItem("");
    }
  };

  const applyPreviewTemplate = (value: string) =>
    value
      .replaceAll("{{productName}}", product?.name || "Your Product")
      .replaceAll("{{amount}}", "$29.00");

  const weeklyDayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dunningEmailEditors = [
    { stage: 1 as const, subjectKey: "dunningEmail1Subject" as const, bodyKey: "dunningEmail1Body" as const, title: "Email 1 · Immediate" },
    { stage: 2 as const, subjectKey: "dunningEmail2Subject" as const, bodyKey: "dunningEmail2Body" as const, title: "Email 2 · 24h follow-up" },
    { stage: 3 as const, subjectKey: "dunningEmail3Subject" as const, bodyKey: "dunningEmail3Body" as const, title: "Email 3 · Final reminder" },
  ];
  const weeklyDigestLabel = `${weeklyDayLabels[notificationsForm.weeklyDigestDay]} ${(() => {
    const [h, m] = notificationsForm.weeklyDigestTime.split(":").map((x) => Number(x));
    const hour12 = ((h + 11) % 12) + 1;
    const meridian = h >= 12 ? "pm" : "am";
    return `${hour12}${m === 0 ? "" : `:${String(m).padStart(2, "0")}`}${meridian}`;
  })()}`;

  const integrationStatusRows = [
    {
      key: "stripe",
      label: "Stripe",
      sectionId: "revenue-integration",
      state: integration?.provider === "STRIPE" && integration?.stripeApiKey
        ? "connected"
        : "disconnected",
      sublabel:
        integration?.provider === "STRIPE" && integration?.stripeApiKey ? "connected" : "not connected",
    },
    {
      key: "dodo",
      label: "DodoPayment",
      sectionId: "revenue-integration",
      state: integration?.provider === "DODO_PAYMENTS" && integration?.dodoApiKey
        ? "connected"
        : "disconnected",
      sublabel:
        integration?.provider === "DODO_PAYMENTS" && integration?.dodoApiKey ? "connected" : "not connected",
    },
    {
      key: "ga4",
      label: "Google Analytics",
      sectionId: "analytics-settings",
      state: analyticsConfig?.isConnected ? "connected" : "disconnected",
      sublabel: analyticsConfig?.isConnected ? "connected" : "not connected",
    },
    {
      key: "dunning",
      label: "Dunning emails",
      sectionId: "dunning-settings",
      state: dunningForm.dunningEnabled
        ? dunningForm.stripeWebhookSecret || dunningForm.dodoWebhookSecret
          ? "amber"
          : "disconnected"
        : "disconnected",
      sublabel:
        dunningForm.dunningEnabled
          ? dunningForm.stripeWebhookSecret || dunningForm.dodoWebhookSecret
            ? "webhook unverified"
            : "missing webhook secret"
          : "disabled",
    },
  ] as const;

  const renderStatusDot = (state: "connected" | "amber" | "disconnected") => {
    if (state === "connected") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (state === "amber") return <AlertCircle className="h-4 w-4 text-amber-500" />;
    return <Circle className="h-4 w-4 text-rose-500" />;
  };

  const sendWebhookTest = async (provider: "stripe" | "dodo") => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      if (provider === "stripe") {
        const url = `${stripeWebhookUrl}&test=1&token=${encodeURIComponent(dunningForm.stripeWebhookSecret || "")}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type: "invoice.payment_failed",
            data: {
              id: `in_test_${Date.now()}`,
              amount_due: 2900,
              currency: "USD",
              customer: "cus_test",
              customer_email: "test-founder@example.com",
              customer_name: "Test Founder",
              hosted_invoice_url: "https://example.com/billing",
            },
          }),
          signal: controller.signal,
        });
        setStripeTestResult(res.ok ? "✓ Received successfully" : "✗ Failed — check your URL/secret.");
      } else {
        const url = `${dodoWebhookUrl}${dodoWebhookUrl.includes("?") ? "&" : "?"}test=1`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type: "payment_failed",
            data: {
              id: `dp_test_${Date.now()}`,
              amount: 2900,
              currency: "USD",
              customer_email: "test-founder@example.com",
              customer_name: "Test Founder",
              payment_url: "https://example.com/checkout",
            },
          }),
          signal: controller.signal,
        });
        setDodoTestResult(res.ok ? "✓ Received successfully" : "✗ Failed — check your URL/token.");
      }

      await Promise.all([
        utils.revenue.listWebhookEvents.invalidate({ productId, provider: "STRIPE", limit: 5 }),
        utils.revenue.listWebhookEvents.invalidate({ productId, provider: "DODO_PAYMENTS", limit: 5 }),
      ]);
    } catch {
      if (provider === "stripe") setStripeTestResult("✗ Timeout — check your URL.");
      else setDodoTestResult("✗ Timeout — check your URL.");
    } finally {
      clearTimeout(timeout);
    }
  };

  if (isLoading || !form) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-brand-muted" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-brand-muted mt-1">Manage {product?.name} configuration</p>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'status', label: 'Status' },
              { id: 'general', label: 'General' },
              { id: 'integrations', label: 'Integrations' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'dunning', label: 'Dunning' },
              { id: 'webhooks', label: 'Webhooks' },
              { id: 'danger', label: 'Danger' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === t.id
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-brand-surface/50 text-brand-muted border border-brand-border hover:border-brand-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div hidden={activeTab !== 'status'}>
        <section className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-xl backdrop-blur-xl">
        <h2 className="text-sm font-bold text-white mb-4">Integration status</h2>
        <div className="space-y-2.5">
          {integrationStatusRows.map((row) => (
            <button
              key={row.key}
              onClick={() => {
                const target = document.getElementById(row.sectionId);
                target?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-left transition-colors hover:border-brand-muted"
            >
              {renderStatusDot(row.state)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{row.label}</p>
                <p className="text-xs text-brand-muted">{row.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
        </section>
      </div>

      {/* Notifications */}
      <div hidden={activeTab !== 'notifications'}>
        <section id="notifications-settings" className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-xl backdrop-blur-xl transition-all hover:border-brand-muted">
        <div className="flex items-center gap-2.5 mb-6">
          <Bell className="h-5 w-5 text-brand-primary" />
          <h2 className="text-sm font-bold text-white">Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              label: "Payment failed",
              value: notificationsForm.paymentFailedEnabled,
              onToggle: () => setNotificationsForm((prev) => ({ ...prev, paymentFailedEnabled: !prev.paymentFailedEnabled })),
            },
            {
              label: `Health score drops below ${notificationsForm.healthScoreThreshold}`,
              value: notificationsForm.healthScoreEnabled,
              onToggle: () => setNotificationsForm((prev) => ({ ...prev, healthScoreEnabled: !prev.healthScoreEnabled })),
            },
            {
              label: "Traffic spike (3× average)",
              value: notificationsForm.trafficSpikeEnabled,
              onToggle: () => setNotificationsForm((prev) => ({ ...prev, trafficSpikeEnabled: !prev.trafficSpikeEnabled })),
            },
            {
              label: "Issue overdue",
              value: notificationsForm.issueOverdueEnabled,
              onToggle: () => setNotificationsForm((prev) => ({ ...prev, issueOverdueEnabled: !prev.issueOverdueEnabled })),
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-bg/40 px-4 py-3">
              <span className="text-sm font-medium text-white">{item.label}</span>
              <button
                onClick={item.onToggle}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  item.value
                    ? "bg-brand-primary text-white"
                    : "bg-brand-bg/70 text-brand-muted border border-brand-border"
                }`}
              >
                {item.value ? "on" : "off"}
              </button>
            </div>
          ))}

          <div className="rounded-xl border border-brand-border bg-brand-bg/40 px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Weekly digest email</span>
              <button
                onClick={() => setNotificationsForm((prev) => ({ ...prev, weeklyDigestEnabled: !prev.weeklyDigestEnabled }))}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  notificationsForm.weeklyDigestEnabled
                    ? "bg-brand-primary text-white"
                    : "bg-brand-bg/70 text-brand-muted border border-brand-border"
                }`}
              >
                {notificationsForm.weeklyDigestEnabled ? "on" : "off"}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={notificationsForm.weeklyDigestDay}
                onChange={(e) => setNotificationsForm((prev) => ({ ...prev, weeklyDigestDay: Number(e.target.value) }))}
                className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-2.5 text-sm text-white focus:border-brand-primary focus:outline-none"
              >
                {weeklyDayLabels.map((day, idx) => (
                  <option key={day} value={idx}>{day}</option>
                ))}
              </select>
              <input
                type="time"
                value={notificationsForm.weeklyDigestTime}
                onChange={(e) => setNotificationsForm((prev) => ({ ...prev, weeklyDigestTime: e.target.value }))}
                className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-2.5 text-sm text-white focus:border-brand-primary focus:outline-none"
              />
            </div>
            <p className="text-xs text-brand-muted">{weeklyDigestLabel}</p>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Health threshold</label>
              <input
                type="number"
                min={1}
                max={100}
                value={notificationsForm.healthScoreThreshold}
                onChange={(e) =>
                  setNotificationsForm((prev) => ({
                    ...prev,
                    healthScoreThreshold: Math.max(1, Math.min(100, Number(e.target.value) || 60)),
                  }))
                }
                className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-2.5 text-sm text-white focus:border-brand-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() =>
                updateNotifications.mutate({
                  productId,
                  ...notificationsForm,
                })
              }
              disabled={updateNotifications.isPending}
              className="flex h-[42px] items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(var(--color-brand-primary-rgb),0.3)]"
            >
              {updateNotifications.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
          {notificationsSaved && <p className="text-xs font-semibold text-brand-success">✓ Notification settings saved</p>}
        </div>
        </section>
      </div>

      {/* Analytics Status */}
      <div hidden={activeTab !== 'integrations'}>
        <section id="analytics-settings" className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-xl backdrop-blur-xl transition-all hover:border-brand-muted">
        <h2 className="text-sm font-bold text-white">Google Analytics</h2>
        <p className="text-xs text-brand-muted mt-1">
          {analyticsConfig?.isConnected
            ? `Connected${analyticsConfig.propertyId ? ` · Property ${analyticsConfig.propertyId}` : ""}`
            : "Not connected"}
        </p>
        <button
          onClick={() => router.push(`/${productId}/analytics`)}
          className="mt-4 rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-2 text-sm font-semibold text-brand-muted hover:text-white"
        >
          Open Analytics Settings
        </button>
        </section>
      </div>

      {/* General */}
      <div hidden={activeTab !== 'general'}>
        <section id="general-settings" className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-xl backdrop-blur-xl transition-all hover:border-brand-muted">
        <h2 className="text-sm font-bold text-white mb-6">General</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Product Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-2.5 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-2.5 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:outline-none resize-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Website</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-2.5 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-2.5 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:outline-none transition-all appearance-none">
              <option value="BETA" className="bg-brand-surface">Beta</option>
              <option value="LIVE" className="bg-brand-surface">Live</option>
              <option value="ARCHIVED" className="bg-brand-surface">Archived</option>
            </select>
          </div>
          <button
            onClick={() => updateProduct.mutate({ id: productId, name: form.name, description: form.description, website: form.website, status: form.status })}
            disabled={updateProduct.isPending}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all disabled:opacity-50 mt-2 shadow-[0_0_15px_rgba(var(--color-brand-primary-rgb),0.3)]"
          >
            {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
        </section>
      </div>

      {/* Integration */}
      <div hidden={activeTab !== 'integrations'}>
        <section id="revenue-integration" className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-xl backdrop-blur-xl transition-all hover:border-brand-muted">
        <div className="flex items-center gap-2.5 mb-6">
          <Shield className="h-5 w-5 text-brand-primary" />
          <h2 className="text-sm font-bold text-white">Revenue Integration</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-2.5 uppercase tracking-wider">Provider</label>
            <div className="grid grid-cols-2 gap-3">
              {(["STRIPE", "DODO_PAYMENTS"] as const).map((p: any) => (
                <button key={p} onClick={() => setIntegrationForm({ ...integrationForm, provider: p })}
                  className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all ${integrationForm.provider === p ? "bg-brand-primary/10 text-brand-primary border-brand-primary shadow-[0_0_10px_rgba(var(--color-brand-primary-rgb),0.2)]" : "bg-brand-bg/50 border-brand-border text-brand-muted hover:border-brand-primary/40"}`}>
                  {p === "STRIPE" ? "Stripe" : "DodoPayment"}
                </button>
              ))}
            </div>
          </div>

          {integrationForm.provider === "STRIPE" && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted mb-2 uppercase tracking-wider"><Key className="h-3.5 w-3.5" /> Stripe Restricted Key</label>
              <input type="text" value={integrationForm.stripeApiKey} onChange={(e) => setIntegrationForm({ ...integrationForm, stripeApiKey: e.target.value })} placeholder="rk_live_..." className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-2.5 text-sm font-mono text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:outline-none transition-all" />
              <p className="text-[11px] text-brand-muted mt-2">Read-only key with access to Subscriptions, Customers, Charges.</p>
            </div>
          )}

          {integrationForm.provider === "DODO_PAYMENTS" && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted mb-2 uppercase tracking-wider"><Key className="h-3.5 w-3.5" /> DodoPayment API Key</label>
              <input type="text" value={integrationForm.dodoApiKey} onChange={(e) => setIntegrationForm({ ...integrationForm, dodoApiKey: e.target.value })} placeholder="Your DodoPayments API key" className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-4 py-2.5 text-sm font-mono text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:outline-none transition-all" />
            </div>
          )}

          <button
            onClick={() => updateIntegration.mutate({ productId, ...integrationForm })}
            disabled={updateIntegration.isPending}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all disabled:opacity-50 mt-2 shadow-[0_0_15px_rgba(var(--color-brand-primary-rgb),0.3)]"
          >
            {updateIntegration.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Integration
          </button>
          {integrationSaved && <p className="text-xs font-semibold text-emerald-400 mt-2">✓ Integration saved successfully</p>}
        </div>
        </section>
      </div>

      {/* Dunning */}
      <div hidden={activeTab !== 'dunning'}>
        <section id="dunning-settings" className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-xl backdrop-blur-xl transition-all hover:border-brand-muted">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <Mail className="h-5 w-5 text-brand-primary" />
              <h2 className="text-sm font-bold text-white">Dunning & Recover</h2>
            </div>
            <button
              onClick={() => setDunningForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                dunningForm.enabled ? "bg-brand-primary text-white" : "bg-brand-bg/70 text-brand-muted border border-brand-border"
              }`}
            >
              {dunningForm.enabled ? "Automated" : "Disabled"}
            </button>
          </div>
          <p className="text-xs text-brand-muted mb-6">Automatically email customers when a failed payment occurs. Each attempt includes a secure link to update payment methods.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Retry Schedule</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} value={dunningForm.intervalDays} onChange={(e) => setDunningForm({ ...dunningForm, intervalDays: Number(e.target.value) })} className="w-16 rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2 text-sm text-white focus:border-brand-primary focus:outline-none" />
                  <span className="text-xs text-brand-muted font-medium">days between attempts</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Max Attempts</label>
                <input type="number" min={1} max={5} value={dunningForm.maxRetries} onChange={(e) => setDunningForm({ ...dunningForm, maxRetries: Number(e.target.value) })} className="w-16 rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2 text-sm text-white focus:border-brand-primary focus:outline-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => updateDunning.mutate({ productId, ...dunningForm })}
                disabled={updateDunning.isPending}
                className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(var(--color-brand-primary-rgb),0.3)]"
              >
                {updateDunning.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Dunning Rules
              </button>
              <button
                onClick={() => setShowEmailPreview(true)}
                className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-bg/50 px-5 py-2.5 text-sm font-bold text-brand-muted hover:text-white transition-all"
              >
                <Eye className="h-4 w-4" />
                Preview Emails
              </button>
            </div>
            {dunningSaved && <p className="text-xs font-semibold text-emerald-400">✓ Dunning settings updated</p>}
          </div>
        </section>
      </div>

      {/* Webhooks (under Integrations) */}
      <div hidden={activeTab !== 'integrations'}>
        <section id="webhook-settings" className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-xl backdrop-blur-xl transition-all hover:border-brand-muted mt-6">
          <div className="flex items-center gap-2.5 mb-6">
            <Globe className="h-5 w-5 text-brand-primary" />
            <h2 className="text-sm font-bold text-white">Platform Webhooks</h2>
          </div>
          <p className="text-xs text-brand-muted mb-6">These URLs are automatically configured in your billing provider. If you see status issues, you can trigger a manual test.</p>
          <div className="space-y-3">
            {webhookCallbacks.map((item) => (
              <div key={item.provider} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-bg/40 px-4 py-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{item.provider} Callback</span>
                  <p className="text-xs font-mono text-brand-muted truncate max-w-[300px]">{item.url}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${item.status === "active" ? "bg-emerald-400" : "bg-brand-muted animate-pulse"}`} />
                    <span className="text-[10px] font-bold text-brand-muted uppercase">{item.status}</span>
                  </div>
                  <button
                    onClick={() => sendWebhookTest(item.provider as any)}
                    className="rounded-lg bg-brand-bg/60 border border-brand-border px-3 py-1.5 text-[10px] font-bold text-white hover:border-brand-muted transition-all"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Danger Zone (under General) */}
      <div hidden={activeTab !== 'general'}>
        <section id="danger-zone" className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 shadow-xl backdrop-blur-xl mt-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Trash2 className="h-5 w-5 text-rose-500" />
            <h2 className="text-sm font-bold text-rose-500">Danger Zone</h2>
          </div>
          <p className="text-xs text-rose-500/80 mb-6">Permanently delete this product and all associated data including revenue history, analytics, and issues. This action cannot be undone.</p>
          
          <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-6 py-5">
            <div>
              <p className="text-sm font-bold text-rose-500">Delete {product?.name}</p>
              <p className="text-[11px] text-rose-500/70 pt-0.5 font-medium">Type <span className="font-mono bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-500">DELETE</span> to confirm.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-28 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-2 text-xs font-mono font-bold text-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
              />
              <button
                onClick={() => deleteProduct.mutate({ id: productId })}
                disabled={deleteConfirm !== "DELETE" || deleteProduct.isPending}
                className="rounded-xl bg-rose-500 px-6 py-2 text-xs font-bold text-white hover:bg-rose-600 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {deleteProduct.isPending ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {showEmailPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080B12]/80 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Dunning Email Preview & Editor</h3>
              <button
                onClick={() => setShowEmailPreview(false)}
                className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted hover:text-white"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-brand-muted mb-4">
              You can use placeholders <code className="rounded bg-brand-bg px-1">{"{{productName}}"}</code> and <code className="rounded bg-brand-bg px-1">{"{{amount}}"}</code>.
            </p>

            {dunningEmailEditors.map((item) => (
              <div key={item.stage} className="mb-4 rounded-xl border border-brand-border bg-brand-bg/40 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-3">{item.title}</p>
                <div className="space-y-3">
                  <input
                    value={dunningForm[item.subjectKey]}
                    onChange={(e) =>
                      setDunningForm((prev) => ({ ...prev, [item.subjectKey]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-3.5 py-2 text-sm text-white focus:border-brand-primary focus:outline-none"
                    placeholder="Subject"
                  />
                  <textarea
                    value={dunningForm[item.bodyKey]}
                    onChange={(e) =>
                      setDunningForm((prev) => ({ ...prev, [item.bodyKey]: e.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg/50 px-3.5 py-2 text-sm text-white focus:border-brand-primary focus:outline-none resize-y"
                    placeholder="Body"
                  />
                  <div className="rounded-lg border border-brand-border bg-brand-bg/60 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-brand-muted mb-1">Preview</p>
                    <p className="text-[11px] text-brand-muted">
                      From: {(dunningForm.dunningSenderName || "Indiqo").trim() || "Indiqo"} &lt;
                      {dunningForm.dunningFromEmail || "billing@yourdomain.com"}&gt;
                    </p>
                    <p className="text-[11px] text-brand-muted mt-1">
                      Subject: {applyPreviewTemplate(dunningForm[item.subjectKey])}
                    </p>
                    <p className="mt-2 text-xs text-white whitespace-pre-wrap">
                      {applyPreviewTemplate(dunningForm[item.bodyKey])}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowEmailPreview(false)}
                className="rounded-xl border border-brand-border px-4 py-2 text-sm font-semibold text-brand-muted hover:text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
