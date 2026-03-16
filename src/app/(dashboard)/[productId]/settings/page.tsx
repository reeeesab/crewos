"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Trash2, Save, AlertTriangle, Key, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc/provider";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const utils = trpc.useUtils();
  const { data: product, isLoading } = trpc.product.get.useQuery({ id: productId });
  const { data: integration } = trpc.revenue.getIntegration.useQuery({ productId });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [form, setForm] = useState<any>(null);
  const [integrationForm, setIntegrationForm] = useState({
    provider: "STRIPE" as "STRIPE" | "DODO_PAYMENTS",
    stripeApiKey: "",
    dodoApiKey: ""
  });
  const [integrationSaved, setIntegrationSaved] = useState(false);

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

  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => { utils.product.get.invalidate({ id: productId }); utils.product.list.invalidate(); }
  });

  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => { router.push("/portfolio"); }
  });

  const updateIntegration = trpc.revenue.updateIntegration.useMutation({
    onSuccess: () => { 
      utils.revenue.getIntegration.invalidate({ productId });
      setIntegrationSaved(true);
      setTimeout(() => setIntegrationSaved(false), 3000);
    }
  });

  if (isLoading || !form) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-sf-text-muted" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-sf-text-primary">Settings</h1>
        <p className="text-sm text-sf-text-secondary mt-1">Manage {product?.name} configuration</p>
      </div>

      {/* General */}
      <section className="relative overflow-hidden rounded-2xl border border-sf-border-subtle bg-sf-surface p-8 shadow-xl backdrop-blur-xl transition-all hover:border-sf-border-default">
        <h2 className="text-sm font-bold text-sf-text-primary mb-6">General</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-sf-text-secondary mb-1.5 uppercase tracking-wider">Product Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-sf-text-secondary mb-1.5 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none resize-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-sf-text-secondary mb-1.5 uppercase tracking-wider">Website</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-sf-text-secondary mb-1.5 uppercase tracking-wider">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all appearance-none">
              <option value="BETA" className="bg-sf-elevated">Beta</option>
              <option value="LIVE" className="bg-sf-elevated">Live</option>
              <option value="ARCHIVED" className="bg-sf-elevated">Archived</option>
            </select>
          </div>
          <button
            onClick={() => updateProduct.mutate({ id: productId, name: form.name, description: form.description, website: form.website, status: form.status })}
            disabled={updateProduct.isPending}
            className="flex items-center gap-2 rounded-xl bg-sf-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-sf-accent/90 transition-all disabled:opacity-50 mt-2 shadow-[0_0_15px_rgba(var(--color-sf-accent-rgb),0.3)]"
          >
            {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </section>

      {/* Integration */}
      <section className="relative overflow-hidden rounded-2xl border border-sf-border-subtle bg-sf-surface p-8 shadow-xl backdrop-blur-xl transition-all hover:border-sf-border-default">
        <div className="flex items-center gap-2.5 mb-6">
          <Shield className="h-5 w-5 text-sf-accent" />
          <h2 className="text-sm font-bold text-sf-text-primary">Revenue Integration</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-sf-text-secondary mb-2.5 uppercase tracking-wider">Provider</label>
            <div className="grid grid-cols-2 gap-3">
              {(["STRIPE", "DODO_PAYMENTS"] as const).map((p: any) => (
                <button key={p} onClick={() => setIntegrationForm({ ...integrationForm, provider: p })}
                  className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all ${integrationForm.provider === p ? "bg-sf-accent/10 text-sf-accent border-sf-accent shadow-[0_0_10px_rgba(var(--color-sf-accent-rgb),0.2)]" : "bg-sf-base/50 border-sf-border-subtle text-sf-text-secondary hover:border-sf-accent/40"}`}>
                  {p === "STRIPE" ? "Stripe" : "DodoPayment"}
                </button>
              ))}
            </div>
          </div>

          {integrationForm.provider === "STRIPE" && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-sf-text-secondary mb-2 uppercase tracking-wider"><Key className="h-3.5 w-3.5" /> Stripe Restricted Key</label>
              <input type="text" value={integrationForm.stripeApiKey} onChange={(e) => setIntegrationForm({ ...integrationForm, stripeApiKey: e.target.value })} placeholder="rk_live_..." className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm font-mono text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all" />
              <p className="text-[11px] text-sf-text-muted mt-2">Read-only key with access to Subscriptions, Customers, Charges.</p>
            </div>
          )}

          {integrationForm.provider === "DODO_PAYMENTS" && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-sf-text-secondary mb-2 uppercase tracking-wider"><Key className="h-3.5 w-3.5" /> DodoPayment API Key</label>
              <input type="text" value={integrationForm.dodoApiKey} onChange={(e) => setIntegrationForm({ ...integrationForm, dodoApiKey: e.target.value })} placeholder="Your DodoPayments API key" className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm font-mono text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all" />
            </div>
          )}

          <button
            onClick={() => updateIntegration.mutate({ productId, ...integrationForm })}
            disabled={updateIntegration.isPending}
            className="flex items-center gap-2 rounded-xl bg-sf-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-sf-accent/90 transition-all disabled:opacity-50 mt-2 shadow-[0_0_15px_rgba(var(--color-sf-accent-rgb),0.3)]"
          >
            {updateIntegration.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Integration
          </button>
          {integrationSaved && <p className="text-xs font-semibold text-green-600 mt-2">✓ Integration saved successfully</p>}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="relative overflow-hidden rounded-2xl border border-sf-red/30 bg-sf-red/5 p-8 shadow-xl backdrop-blur-md">
        <h2 className="flex items-center gap-2.5 text-sm font-bold text-sf-red mb-3">
          <AlertTriangle className="h-5 w-5" /> Danger Zone
        </h2>
        <p className="text-sm text-sf-text-secondary mb-6">
          Permanently delete this product and all associated data (revenue, issues, costs, changelogs).
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 rounded-xl bg-sf-red px-5 py-2.5 text-sm font-bold text-white hover:bg-sf-red/90 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
        >
          <Trash2 className="h-4 w-4" />
          Delete Product
        </button>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080B12]/80 backdrop-blur-md p-4 transition-all">
          <div className="w-full max-w-sm rounded-2xl border border-sf-border-subtle bg-sf-elevated p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-sf-red mb-2 tracking-tight">Delete "{product?.name}"?</h3>
            <p className="text-sm text-sf-text-secondary mb-6">
              This will permanently delete all data. Type <strong className="text-sf-text-primary px-1">{product?.name}</strong> to confirm.
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={product?.name}
              className="w-full rounded-xl border border-sf-red/40 bg-sf-base/50 px-4 py-2.5 text-sm text-sf-text-primary focus:border-sf-red focus:ring-1 focus:ring-sf-red/30 focus:outline-none mb-6 transition-all"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }} className="flex-1 rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-2.5 text-sm font-semibold text-sf-text-secondary hover:text-sf-text-primary hover:bg-sf-border-subtle transition-all">
                Cancel
              </button>
              <button
                onClick={() => deleteProduct.mutate({ id: productId })}
                disabled={deleteConfirm !== product?.name || deleteProduct.isPending}
                className="flex-1 rounded-xl bg-sf-red px-4 py-2.5 text-sm font-bold text-white hover:bg-sf-red/90 transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                {deleteProduct.isPending ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
