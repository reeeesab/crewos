"use client";

import { useState } from "react";
import { mockBIPPosts } from "@/lib/mock-data";
import { Sparkles, Twitter, Linkedin, Play, Edit3, Clock, Trash2 } from "lucide-react";

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "twitter") return <Twitter className="h-3.5 w-3.5 text-[#1da1f2]" />;
  if (platform === "linkedin") return <Linkedin className="h-3.5 w-3.5 text-[#0a66c2]" />;
  return (
    <div className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-brand-muted text-[7px] font-bold text-brand-bg">
      TT
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-brand-muted/10 text-brand-muted",
    posted: "bg-emerald-500/10 text-emerald-400",
    scheduled: "bg-brand-primary/10 text-brand-primary",
    discarded: "bg-rose-500/10 text-rose-400",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-medium ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

export default function BuildInPublicPage() {
  const [posts, setPosts] = useState(mockBIPPosts);

  function discard(id: string) {
    setPosts((prev) => prev.map((p: any) => p.id === id ? { ...p, status: "discarded" } : p));
  }

  const drafts = posts.filter((p: any) => p.status === "draft");
  const active = posts.filter((p: any) => p.status !== "draft");

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
        <div className="flex gap-3">
          {[
            { platform: "twitter", handle: "@shipfast_dev", connected: true },
            { platform: "linkedin", handle: "ShipFast", connected: true },
            { platform: "tiktok", handle: "@shipfast", connected: false },
          ].map((acc: any) => (
            <div
              key={acc.platform}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                acc.connected ? "border-emerald-500/20 bg-emerald-500/5" : "border-brand-border bg-brand-bg"
              }`}
            >
              <PlatformIcon platform={acc.platform} />
              <span className="text-xs text-white">{acc.handle}</span>
              {acc.connected ? (
                <span className="font-mono text-[9px] text-emerald-400">● connected</span>
              ) : (
                <button className="font-mono text-[9px] text-brand-primary underline">connect</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Draft cards */}
      {drafts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-brand-muted">
            Drafts ({drafts.length})
          </h2>
          {drafts.map((post: any) => (
            <div key={post.id} className="rounded-lg border border-brand-primary/20 bg-brand-surface p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-brand-bg">
                  <PlatformIcon platform={post.platform} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white capitalize">{post.platform}</span>
                    <span className="font-mono text-[10px] text-brand-muted">from: {post.sourceLabel}</span>
                  </div>
                  <p className="text-sm text-white leading-relaxed">{post.draftText}</p>
                  <div className="mt-1 font-mono text-[10px] text-brand-muted">
                    {post.draftText.length} chars
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-brand-border">
                <button className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                  <Play className="h-3 w-3" />
                  Post now
                </button>
                <button className="flex items-center gap-1.5 rounded-md bg-brand-bg px-2.5 py-1 text-[10px] font-medium text-brand-muted hover:bg-brand-surface hover:text-white transition-colors">
                  <Edit3 className="h-3 w-3" />
                  Edit draft
                </button>
                <button className="flex items-center gap-1.5 rounded-md bg-brand-primary/10 px-2.5 py-1 text-[10px] font-medium text-brand-primary hover:bg-brand-primary/20 transition-colors">
                  <Clock className="h-3 w-3" />
                  Schedule
                </button>
                <button
                  onClick={() => discard(post.id)}
                  className="flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-1 text-[10px] font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Discard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-brand-muted">
          History
        </h2>
        {active.map((post: any) => (
          <div key={post.id} className="flex items-start gap-3 rounded-lg border border-brand-border bg-brand-surface p-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-bg">
              <PlatformIcon platform={post.platform} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-white capitalize">{post.platform}</span>
                <StatusBadge status={post.status} />
                {post.status === "scheduled" && post.scheduledAt && (
                  <span className="font-mono text-[10px] text-brand-primary">→ {post.scheduledAt}</span>
                )}
                {post.status === "posted" && post.postedAt && (
                  <span className="font-mono text-[10px] text-brand-muted">Posted {post.postedAt}</span>
                )}
              </div>
              <p className="text-xs text-brand-muted line-clamp-2">{post.draftText}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
