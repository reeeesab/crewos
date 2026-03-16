"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Info, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/provider";

const PERMISSION_FIELDS = [
  { key: "revenue", label: "Revenue" },
  { key: "roadmap", label: "Issues" },
  { key: "issues", label: "Issues" },
  { key: "costs", label: "Costs" },
  { key: "analytics", label: "Analytics" },
  { key: "social", label: "Social" },
  { key: "team", label: "Team" },
  { key: "changelog", label: "Changelog" },
  { key: "billing", label: "Billing" },
  { key: "buildInPublic", label: "Build in Public" },
  { key: "healthScore", label: "Health Score" },
  { key: "marginData", label: "Margin Data" },
];

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    OWNER: "bg-sf-accent/10 text-sf-accent",
    EDITOR: "bg-sf-purple/10 text-sf-purple",
    VIEWER: "bg-sf-text-muted/10 text-sf-text-muted",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-medium ${styles[role] ?? ""}`}>
      {role}
    </span>
  );
}

export default function TeamPage() {
  const params = useParams();
  const productId = params.productId as string;
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.product.listMembers.useQuery({ productId });
  const updatePermissions = trpc.product.updateMemberPermissions.useMutation({
    onSuccess: () => {
      utils.product.listMembers.invalidate({ productId });
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sf-text-muted" />
      </div>
    );
  }

  const allMembers = members ?? [];
  const selectedMember = allMembers.find(m => m.id === selectedMemberId) || allMembers[0];

  function togglePermission(memberId: string, key: string) {
    if (!selectedMember || selectedMember.role === "OWNER") return;

    const currentPerms = (selectedMember.permissions as Record<string, boolean>) || {};
    const newPerms = {
      ...currentPerms,
      [key]: !currentPerms[key]
    };

    updatePermissions.mutate({
      memberId,
      permissions: newPerms
    });
  }

  const currentPermissions = (selectedMember?.permissions as Record<string, boolean>) || {};
  const allowedFields = PERMISSION_FIELDS.filter(f => currentPermissions[f.key]);
  const blockedFields = PERMISSION_FIELDS.filter(f => !currentPermissions[f.key]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-sf-text">Team & Access</h1>
          <p className="text-xs text-sf-text-secondary">{allMembers.length} members</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 rounded-lg bg-sf-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-sf-accent/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Invite member
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Members list */}
        <div className="col-span-2 rounded-lg border border-sf-border bg-sf-sidebar overflow-hidden">
          <div className="border-b border-sf-border px-4 py-2.5">
            <h2 className="text-[11px] font-medium uppercase tracking-wide text-sf-text-muted">Members</h2>
          </div>
          <div className="divide-y divide-sf-border/50">
            {allMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sf-input/30 ${
                  selectedMember?.id === member.id ? "bg-sf-input/50" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white bg-sf-accent/20"
                >
                  {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-sf-text">{member.user.name || "Unknown User"}</div>
                  <div className="text-[10px] text-sf-text-muted truncate">{member.user.email}</div>
                </div>
                <RoleBadge role={member.role} />
              </button>
            ))}
          </div>
        </div>

        {/* Permission grid */}
        <div className="col-span-3 space-y-4">
          {selectedMember && (
            <>
              <div className="rounded-lg border border-sf-border bg-sf-sidebar overflow-hidden">
                <div className="border-b border-sf-border px-4 py-2.5 flex items-center justify-between">
                  <h2 className="text-[11px] font-medium uppercase tracking-wide text-sf-text-muted">
                    Permissions — {selectedMember.user.name || selectedMember.user.email}
                  </h2>
                  {selectedMember.role === "OWNER" && (
                    <span className="font-mono text-[10px] text-sf-accent">All access (owner)</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {PERMISSION_FIELDS.map((f) => {
                      const enabled = selectedMember.role === "OWNER" || !!currentPermissions[f.key];
                      return (
                        <button
                          key={f.key}
                          disabled={selectedMember.role === "OWNER" || updatePermissions.isPending}
                          onClick={() => togglePermission(selectedMember.id, f.key)}
                          className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors ${
                            enabled
                              ? "border-sf-accent/20 bg-sf-accent/5 hover:bg-sf-accent/10"
                              : "border-sf-border bg-sf-input/30 hover:bg-sf-input"
                          } disabled:cursor-default`}
                        >
                          <div className={`h-3.5 w-3.5 rounded-sm border ${enabled ? "border-sf-accent bg-sf-accent" : "border-sf-border bg-sf-input"} flex items-center justify-center shrink-0`}>
                            {enabled && (
                              <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M2 5l2.5 2.5 3.5-4" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-[10px] ${enabled ? "text-sf-text" : "text-sf-text-muted"}`}>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Summary info box */}
              {selectedMember.role !== "OWNER" && (
                <div className="rounded-lg border border-sf-border bg-sf-sidebar p-3.5">
                  <div className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-sf-accent mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-medium text-sf-text mb-1">
                        {selectedMember.user.name || "Member"} can access {allowedFields.length} of {PERMISSION_FIELDS.length} sections
                      </div>
                      <div className="text-[10px] text-sf-text-muted">
                        <span className="text-sf-green">✓ </span>
                        {allowedFields.map((f) => f.label).join(", ")}
                      </div>
                      {blockedFields.length > 0 && (
                        <div className="text-[10px] text-sf-text-muted mt-0.5">
                          <span className="text-sf-red">✗ </span>
                          {blockedFields.map((f) => f.label).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showInvite && (
        <InviteModal
          productId={productId}
          onClose={() => setShowInvite(false)}
          onSuccess={() => {
            utils.product.listMembers.invalidate({ productId });
            setShowInvite(false);
          }}
        />
      )}
    </div>
  );
}

function InviteModal({ productId, onClose, onSuccess }: { productId: string; onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("VIEWER");
  const [error, setError] = useState<string | null>(null);

  const { data: foundUser, isLoading: isSearching, refetch: search } = trpc.product.searchUserByEmail.useQuery(
    { email },
    { enabled: false }
  );

  const addMember = trpc.product.addMember.useMutation({
    onSuccess,
    onError: (err) => setError(err.message),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    search();
  };

  const handleAdd = () => {
    if (!foundUser) return;
    addMember.mutate({
      productId,
      userId: foundUser.id,
      role,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-sf-border bg-sf-card p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-sf-text mb-1">Invite Team Member</h3>
        <p className="text-xs text-sf-text-muted mb-6">Search for users by their email address to join your project.</p>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] uppercase tracking-wide text-sf-text-muted">Email Address</label>
            <div className="flex gap-2">
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-sf-border bg-sf-input px-3.5 py-2 text-sm text-sf-text placeholder:text-sf-text-muted focus:border-sf-accent focus:outline-none transition-all"
                placeholder="colleague@domain.com"
                required
              />
              <button
                type="submit"
                disabled={isSearching}
                className="rounded-lg bg-sf-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sf-accent/90 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </div>
          )}

          {foundUser && (
            <div className="rounded-xl border border-sf-accent/20 bg-sf-accent/5 p-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-sf-accent text-white flex items-center justify-center font-bold">
                  {foundUser.name?.charAt(0) || foundUser.email.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-sf-text">{foundUser.name || "Known User"}</div>
                  <div className="text-xs text-sf-text-muted">{foundUser.email}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase tracking-wide text-sf-text-muted">Role</label>
                <div className="flex gap-2">
                  {(["VIEWER", "EDITOR"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all border ${
                        role === r
                          ? "bg-sf-accent text-white border-sf-accent shadow-sm"
                          : "bg-white text-sf-text-secondary border-sf-border hover:border-sf-accent/30"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={addMember.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-sf-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sf-accent/90 transition-all"
              >
                {addMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add to Team
              </button>
            </div>
          )}

          {!foundUser && !isSearching && email && (
             <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed text-center">
                  Search results will appear here. Only existing users of SaaSForge can be invited currently.
                </p>
             </div>
          )}
        </form>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-sf-border px-4 py-2 text-sm font-medium text-sf-text-secondary hover:bg-sf-input transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
