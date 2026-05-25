"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/provider";
import { Sparkles, Twitter, Linkedin, Play, Edit3, Clock, Trash2, Share2, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

function PlatformIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p === "twitter" || p === "x") return <Twitter className="h-3.5 w-3.5 text-[#1da1f2]" />;
  if (p === "linkedin") return <Linkedin className="h-3.5 w-3.5 text-[#0a66c2]" />;
  if (p === "threads") return <Share2 className="h-3.5 w-3.5 text-[#ffffff]" />;
  return (
    <div className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-brand-muted text-[7px] font-bold text-brand-bg">
      {p.substring(0, 2).toUpperCase()}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-brand-muted/10 text-brand-muted",
    posted: "bg-emerald-500/10 text-emerald-400",
    scheduled: "bg-brand-primary/10 text-brand-primary",
    failed: "bg-rose-500/10 text-rose-400",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-medium ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

export default function BuildInPublicPage() {
  const { productId } = useParams() as { productId: string };
  const utils = trpc.useUtils();

  const { data: accounts = [] } = trpc.social.listAccounts.useQuery({ productId });
  const { data: posts = [], isLoading } = trpc.social.listPosts.useQuery({ productId });

  const postNow = trpc.social.postNow.useMutation({
    onSuccess: () => utils.social.listPosts.invalidate({ productId }),
  });

  const deletePost = trpc.social.deletePost.useMutation({
    onSuccess: () => utils.social.listPosts.invalidate({ productId }),
  });

  const updatePost = trpc.social.updatePost.useMutation({
    onSuccess: () => utils.social.listPosts.invalidate({ productId }),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  const drafts = posts.filter((p) => p.status === "draft");
  const active = posts.filter((p) => p.status !== "draft");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Build in Public</h1>
          <p className="text-xs text-brand-muted">
            AI-drafted posts from your shipped updates
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-brand-primary/10 px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
          <span className="text-xs font-medium text-brand-primary">Powered by Claude</span>
        </div>
      </div>

      {/* Connected accounts */}
      <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
        <div className="mb-3 font-mono text-[10px] font-medium uppercase tracking-wide text-brand-muted">
          Connected Accounts
        </div>
        <div className="flex flex-wrap gap-3">
          {["twitter", "linkedin", "threads"].map((platform) => {
            const acc = accounts.find((a) => a.platform.toLowerCase() === platform);
            return (
              <div
                key={platform}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  acc ? "border-emerald-500/20 bg-emerald-500/5" : "border-brand-border bg-brand-bg"
                }`}
              >
                <PlatformIcon platform={platform} />
                <span className="text-xs text-white">{acc ? acc.handle : platform}</span>
                {acc ? (
                  <span className="font-mono text-[9px] text-emerald-400">● connected</span>
                ) : (
                  <button className="font-mono text-[9px] text-brand-primary underline">connect</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Draft cards */}
      {drafts.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-brand-muted">
            Drafts ({drafts.length})
          </h2>
          {drafts.map((post) => (
            <div key={post.id} className="rounded-lg border border-brand-primary/20 bg-brand-surface p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-brand-bg">
                  <PlatformIcon platform={post.platform} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white capitalize">{post.platform}</span>
                    {post.sourceType && (
                      <span className="font-mono text-[10px] text-brand-muted">from: {post.sourceType}</span>
                    )}
                  </div>
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{post.draftText}</p>
                  <div className="mt-1 font-mono text-[10px] text-brand-muted">
                    {post.draftText.length} chars
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-brand-border">
                <button
                  disabled={postNow.isPending}
                  onClick={() => postNow.mutate({ id: post.id })}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  {postNow.isPending ? <Loader2 className="h-3 w-3 animate-spin"/> : <Play className="h-3 w-3" />}
                  Post now
                </button>
                <button 
                  className="flex items-center gap-1.5 rounded-md bg-brand-bg px-2.5 py-1 text-[10px] font-medium text-brand-muted hover:bg-brand-surface hover:text-white transition-colors"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit draft
                </button>
                <button
                  onClick={() => {
                    const date = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
                    updatePost.mutate({ id: post.id, status: "scheduled", scheduledAt: date });
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-brand-primary/10 px-2.5 py-1 text-[10px] font-medium text-brand-primary hover:bg-brand-primary/20 transition-colors"
                >
                  <Clock className="h-3 w-3" />
                  Schedule
                </button>
                <button
                  onClick={() => deletePost.mutate({ id: post.id })}
                  className="flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-1 text-[10px] font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Discard
                </button>
              </div>
              {post.errorMessage && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-400">
                  <AlertCircle className="h-3 w-3" />
                  {post.errorMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-brand-border p-8 text-center bg-brand-surface/30">
          <p className="text-sm text-brand-muted">No draft posts found. Drafts are generated automatically when you ship updates.</p>
        </div>
      )}

      {/* History */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-brand-muted">
            History
          </h2>
          {active.map((post) => (
            <div key={post.id} className="flex items-start gap-3 rounded-lg border border-brand-border bg-brand-surface p-3.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-bg">
                <PlatformIcon platform={post.platform} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-white capitalize">{post.platform}</span>
                  <StatusBadge status={post.status} />
                  {post.status === "scheduled" && post.scheduledAt && (
                    <span className="font-mono text-[10px] text-brand-primary">
                      → {format(new Date(post.scheduledAt), "MMM d, h:mm a")}
                    </span>
                  )}
                  {post.status === "posted" && post.postedAt && (
                    <span className="font-mono text-[10px] text-brand-muted">
                      Posted {format(new Date(post.postedAt), "MMM d, h:mm a")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-muted line-clamp-2 whitespace-pre-wrap">{post.draftText}</p>
                {post.errorMessage && (
                  <p className="mt-1 text-[10px] text-rose-400">{post.errorMessage}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
