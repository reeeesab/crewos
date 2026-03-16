"use client";

import { useParams } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc/provider";

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
  const { data: members, isLoading } = trpc.product.listMembers.useQuery({ productId });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sf-text-muted" />
      </div>
    );
  }

  type TeamMember = NonNullable<typeof members>[number];
  const allMembers: TeamMember[] = members ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-sf-text">Team & Access</h1>
          <p className="text-xs text-sf-text-secondary">{allMembers.length} members</p>
        </div>
        <div className="rounded-lg border border-sf-border bg-sf-sidebar px-3 py-2 text-[11px] text-sf-text-muted">
          Member management is not available yet.
        </div>
      </div>

      <div className="rounded-lg border border-sf-border bg-sf-sidebar overflow-hidden">
        <div className="border-b border-sf-border px-4 py-2.5">
          <h2 className="text-[11px] font-medium uppercase tracking-wide text-sf-text-muted">Current Members</h2>
        </div>

        {allMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <Users className="h-8 w-8 text-sf-text-muted/60" />
            <div>
              <p className="text-sm font-medium text-sf-text">No team members yet</p>
              <p className="mt-1 text-xs text-sf-text-muted">This project currently only supports the owner view.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-sf-border/50">
            {allMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sf-accent/20 text-xs font-semibold text-white">
                  {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-sf-text">{member.user.name || "Unknown User"}</div>
                  <div className="truncate text-[10px] text-sf-text-muted">{member.user.email}</div>
                </div>
                <RoleBadge role={member.role} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
