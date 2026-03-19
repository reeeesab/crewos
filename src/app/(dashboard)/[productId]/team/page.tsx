"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Copy, KeyRound, Loader2, RefreshCw, Users, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/provider";

type MemberRole = "OWNER" | "EDITOR" | "VIEWER";

function RoleBadge({ role }: { role: MemberRole }) {
  const styles: Record<MemberRole, string> = {
    OWNER: "bg-sf-accent/10 text-sf-accent border border-sf-accent/20",
    EDITOR: "bg-sf-purple/10 text-sf-purple border border-sf-purple/20",
    VIEWER: "bg-sf-text-muted/10 text-sf-text-muted border border-sf-text-muted/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${styles[role]}`}>
      {role}
    </span>
  );
}

export default function TeamPage() {
  const params = useParams();
  const { user } = useUser();
  const productId = params.productId as string;
  const [error, setError] = useState<string | null>(null);

  const { data: members, isLoading } = trpc.product.listMembers.useQuery({ productId });
  const { data: inviteInfo } = trpc.product.getInviteCodeInfo.useQuery({ productId });
  const utils = trpc.useUtils();

  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rotateInvite = trpc.product.rotateInviteCode.useMutation({
    onSuccess: async (result) => {
      setFreshCode(result.code);
      setCopied(false);
      setError(null);
      await utils.product.getInviteCodeInfo.invalidate({ productId });
    },
    onError: (err) => {
      setError(err.message || "Failed to generate invite code");
    }
  });

  const allMembers = members ?? [];

  const isOwner = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email) return false;
    const me = allMembers.find((member) => member.user.email.toLowerCase() === email);
    return me?.role === "OWNER";
  }, [allMembers, user?.primaryEmailAddress?.emailAddress]);

  async function copyCode(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Failed to copy code");
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sf-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sf-text-primary">Team & Access</h1>
          <p className="text-sm font-medium text-sf-text-secondary mt-1">Manage team members and invite codes</p>
        </div>
        {isOwner && (
          <button
            onClick={() => {
              setError(null);
              rotateInvite.mutate({ productId });
            }}
            disabled={rotateInvite.isPending}
            className="flex items-center gap-2 rounded-xl bg-sf-accent px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-sf-accent/90 disabled:opacity-50 shadow-[0_0_15px_rgba(0,212,255,0.3)] disabled:shadow-none"
          >
            {rotateInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {rotateInvite.isPending ? "Generating..." : (inviteInfo?.hasCode ? "Regenerate Code" : "Generate Code")}
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-sf-accent-rose/20 bg-sf-accent-rose/10 px-4 py-3 flex gap-3">
          <AlertCircle className="h-5 w-5 text-sf-accent-rose flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-sf-accent-rose">{error}</p>
        </div>
      )}

      {/* Invite Code Card */}
      <div className="rounded-lg border border-sf-border bg-sf-sidebar/50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sf-accent/10">
            <KeyRound className="h-5 w-5 text-sf-accent" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-sf-text-primary">Project Invite Code</h2>
            <p className="text-xs text-sf-text-muted">Share this code with teammates to give them access</p>
          </div>
        </div>

        {freshCode ? (
          <div className="rounded-lg border border-sf-accent/30 bg-sf-accent/10 p-4">
            <p className="text-xs font-semibold text-sf-accent mb-3">⚠️ Share this code now. It won't be shown again.</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <code className="rounded-lg bg-sf-base/80 px-3 py-2.5 font-mono text-lg font-bold text-sf-accent flex-1 text-center select-all border border-sf-accent/20">
                {freshCode}
              </code>
              <button
                onClick={() => copyCode(freshCode)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-sf-border bg-sf-accent px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-sf-accent/90"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
          </div>
        ) : inviteInfo?.hasCode ? (
          <div className="rounded-lg border border-sf-border-subtle bg-sf-base/50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-sf-text">Code Active</p>
                <p className="text-xs text-sf-text-muted mt-1">
                  <code className="font-mono text-sf-accent">••••-{inviteInfo.hint ?? "----"}</code>
                </p>
                <p className="text-xs text-sf-text-muted mt-1">
                  Last rotated {inviteInfo.updatedAt ? new Date(inviteInfo.updatedAt).toLocaleString() : "unknown"}
                </p>
              </div>
              {!isOwner && <p className="text-xs text-sf-text-muted italic">Ask the project owner to regenerate</p>}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-sf-border-subtle bg-sf-base/50 p-6 text-center">
            <KeyRound className="h-8 w-8 text-sf-text-muted/40 mx-auto mb-2" />
            <p className="text-sm text-sf-text-muted font-medium">
              {isOwner ? "No invite code yet" : "No invite code available"}
            </p>
            <p className="text-xs text-sf-text-muted mt-1">
              {isOwner 
                ? "Click the button above to generate your first invite code" 
                : "Ask the project owner to create one"}
            </p>
          </div>
        )}
      </div>

      {/* Members Card */}
      <div className="rounded-lg border border-sf-border bg-sf-sidebar/50 overflow-hidden">
        <div className="border-b border-sf-border px-6 py-4">
          <h2 className="text-sm font-bold text-sf-text-primary">Team Members</h2>
          <p className="text-xs text-sf-text-muted mt-1">{allMembers.length} {allMembers.length === 1 ? "member" : "members"}</p>
        </div>

        {allMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <Users className="h-10 w-10 text-sf-text-muted/40" />
            <div>
              <p className="text-sm font-semibold text-sf-text">No team members yet</p>
              <p className="mt-1 text-xs text-sf-text-muted">Share your invite code to add teammates</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-sf-border/50">
            {allMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4 hover:bg-sf-bg-glass/30 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sf-accent/20 text-xs font-bold text-white">
                  {member.user.name?.charAt(0)?.toUpperCase() || member.user.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-sf-text-primary">{member.user.name || "Unknown User"}</div>
                  <div className="truncate text-xs text-sf-text-muted">{member.user.email}</div>
                </div>
                <RoleBadge role={member.role as MemberRole} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
