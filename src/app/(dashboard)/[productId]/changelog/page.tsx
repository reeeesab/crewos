"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Sparkles, CheckCircle, Edit3, Trash2, Loader2, AlertCircle, RefreshCw, Megaphone } from "lucide-react";
import { trpc } from "@/lib/trpc/provider";

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    SHIPPED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    BUGFIX: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    IMPROVEMENT: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${styles[type] ?? "bg-brand-surface border border-brand-border text-brand-muted"}`}>
      {type}
    </span>
  );
}

export default function ChangelogPage() {
  const params = useParams();
  const productId = params.productId as string;
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: changelogs, isLoading } = trpc.changelog.list.useQuery({ productId });
  
  const generate = trpc.changelog.generate.useMutation({
    onSuccess: () => {
      utils.changelog.list.invalidate({ productId });
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const publish = trpc.changelog.publish.useMutation({
    onSuccess: () => utils.changelog.list.invalidate({ productId }),
  });

  const discard = trpc.changelog.delete.useMutation({
    onSuccess: () => utils.changelog.list.invalidate({ productId }),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sf-text-muted" />
      </div>
    );
  }

  const drafts = changelogs?.filter((c: any) => c.status === "DRAFT") || [];
  const published = changelogs?.filter((c: any) => c.status === "PUBLISHED") || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Changelog</h1>
          <p className="text-sm font-medium text-brand-muted mt-1">
            Summarize closed issues into professional updates.
          </p>
        </div>
        <button
          onClick={() => generate.mutate({ productId })}
          disabled={generate.isPending}
          className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold tracking-tight text-white transition-all hover:bg-brand-accent disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          {generate.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generate.isPending ? "Generating..." : "AI Generate Draft"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Draft queue */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-sf-text-secondary flex items-center gap-2 mb-2">
            <RefreshCw className="h-3 w-3" />
            Review Drafts ({drafts.length})
          </h2>
          {drafts.map((entry: any) => (
            <div
              key={entry.id}
              className="group relative overflow-hidden rounded-2xl border border-brand-primary/30 bg-brand-surface p-6 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:border-brand-primary/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none"></div>
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <TypeBadge type={entry.type} />
                    <span className="font-mono text-[10px] text-sf-text-muted">
                      Created {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-sf-text-primary tracking-tight mb-2">{entry.title}</h3>
                  <p className="text-sm text-sf-text-secondary leading-relaxed whitespace-pre-wrap">{entry.body}</p>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-2.5 mt-5 pt-5 border-t border-brand-border/50">
                <button
                  onClick={() => publish.mutate({ id: entry.id })}
                  disabled={publish.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 transition-all hover:bg-emerald-500/20"
                >
                  {publish.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Publish Update
                </button>
                <button
                  onClick={() => discard.mutate({ id: entry.id })}
                  disabled={discard.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 transition-all hover:bg-rose-500/20 ml-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Discard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State for Drafts */}
      {drafts.length === 0 && !generate.isPending && (
         <div className="rounded-2xl border border-dashed border-brand-border p-12 text-center bg-brand-surface/30">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg border border-brand-border mb-4 shadow-inner">
              <Megaphone className="h-6 w-6 text-brand-muted opacity-50" />
            </div>
            <p className="text-base font-bold text-white mb-1">No drafts to review</p>
            <p className="text-sm text-brand-muted max-w-sm mx-auto">Close issues on the roadmap to generate a new AI changelog entry.</p>
         </div>
      )}

      {/* Published */}
      {published.length > 0 && (
        <div className="space-y-4 pt-6 mt-8 border-t border-brand-border/50">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-4">
            Published History ({published.length})
          </h2>
          <div className="space-y-4">
            {published.map((entry: any) => (
              <div key={entry.id} className="relative rounded-2xl border border-brand-border bg-brand-surface/40 p-5 shadow-md transition-all hover:bg-brand-surface/70 hover:border-brand-accent">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TypeBadge type={entry.type} />
                      <span className="font-mono text-[10px] text-brand-muted">
                        Published {entry.publishedAt ? new Date(entry.publishedAt).toLocaleDateString() : "unknown"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5 tracking-tight">{entry.title}</h3>
                    <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{entry.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
