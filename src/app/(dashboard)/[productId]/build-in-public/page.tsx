"use client";

import { useState } from "react";
import { mockBIPPosts } from "@/lib/mock-data";
import { Sparkles, Twitter, Linkedin, Play, Edit3, Clock, Trash2 } from "lucide-react";

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "twitter") return <Twitter className="h-3.5 w-3.5 text-[#1da1f2]" />;
  if (platform === "linkedin") return <Linkedin className="h-3.5 w-3.5 text-[#0a66c2]" />;
  return (
    <div className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-sf-text-muted text-[7px] font-bold text-sf-page">
      TT
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-sf-text-muted/10 text-sf-text-muted",
    posted: "bg-sf-green/10 text-sf-green",
    scheduled: "bg-sf-purple/10 text-sf-purple",
    discarded: "bg-sf-red/10 text-sf-red",
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
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: "discarded" } : p));
  }

  const drafts = posts.filter((p) => p.status === "draft");
  const active = posts.filter((p) => p.status !== "draft");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-sf-text">Build in Public</h1>
          <p className="text-xs text-sf-text-secondary">
            AI-drafted posts from your shipped updates
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-sf-purple/10 px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-sf-purple" />
          <span className="text-xs font-medium text-sf-purple">Powered by Claude</span>
        </div>
      </div>

      {/* Connected accounts */}
      <div className="rounded-lg border border-sf-border bg-sf-sidebar p-4">
        <div className="mb-3 font-mono text-[10px] font-medium uppercase tracking-wide text-sf-text-muted">
          Connected Accounts
        </div>
        <div className="flex gap-3">
          {[
            { platform: "twitter", handle: "@shipfast_dev", connected: true },
            { platform: "linkedin", handle: "ShipFast", connected: true },
            { platform: "tiktok", handle: "@shipfast", connected: false },
          ].map((acc) => (
            <div
              key={acc.platform}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                acc.connected ? "border-sf-green/20 bg-sf-green/5" : "border-sf-border bg-sf-input"
              }`}
            >
              <PlatformIcon platform={acc.platform} />
              <span className="text-xs text-sf-text">{acc.handle}</span>
              {acc.connected ? (
                <span className="font-mono text-[9px] text-sf-green">● connected</span>
              ) : (
                <button className="font-mono text-[9px] text-sf-accent underline">connect</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Draft cards */}
      {drafts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-sf-text-muted">
            Drafts ({drafts.length})
          </h2>
          {drafts.map((post) => (
            <div key={post.id} className="rounded-lg border border-sf-accent/20 bg-sf-sidebar p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-sf-card">
                  <PlatformIcon platform={post.platform} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-sf-text capitalize">{post.platform}</span>
                    <span className="font-mono text-[10px] text-sf-text-muted">from: {post.sourceLabel}</span>
                  </div>
                  <p className="text-sm text-sf-text leading-relaxed">{post.draftText}</p>
                  <div className="mt-1 font-mono text-[10px] text-sf-text-muted">
                    {post.draftText.length} chars
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-sf-border/50">
                <button className="flex items-center gap-1.5 rounded-md bg-sf-green/10 px-2.5 py-1 text-[10px] font-medium text-sf-green hover:bg-sf-green/20 transition-colors">
                  <Play className="h-3 w-3" />
                  Post now
                </button>
                <button className="flex items-center gap-1.5 rounded-md bg-sf-input px-2.5 py-1 text-[10px] font-medium text-sf-text-secondary hover:bg-sf-border hover:text-sf-text transition-colors">
                  <Edit3 className="h-3 w-3" />
                  Edit draft
                </button>
                <button className="flex items-center gap-1.5 rounded-md bg-sf-purple/10 px-2.5 py-1 text-[10px] font-medium text-sf-purple hover:bg-sf-purple/20 transition-colors">
                  <Clock className="h-3 w-3" />
                  Schedule
                </button>
                <button
                  onClick={() => discard(post.id)}
                  className="flex items-center gap-1.5 rounded-md bg-sf-red/10 px-2.5 py-1 text-[10px] font-medium text-sf-red hover:bg-sf-red/20 transition-colors"
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
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-sf-text-muted">
          History
        </h2>
        {active.map((post) => (
          <div key={post.id} className="flex items-start gap-3 rounded-lg border border-sf-border bg-sf-sidebar p-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sf-card">
              <PlatformIcon platform={post.platform} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-sf-text capitalize">{post.platform}</span>
                <StatusBadge status={post.status} />
                {post.status === "scheduled" && post.scheduledAt && (
                  <span className="font-mono text-[10px] text-sf-purple">→ {post.scheduledAt}</span>
                )}
                {post.status === "posted" && post.postedAt && (
                  <span className="font-mono text-[10px] text-sf-text-muted">Posted {post.postedAt}</span>
                )}
              </div>
              <p className="text-xs text-sf-text-secondary line-clamp-2">{post.draftText}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
