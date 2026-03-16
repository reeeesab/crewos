"use client";

import { mockSocialAccounts } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, Users, Heart, Eye, Link2 } from "lucide-react";

function PlatformIcon({ platform }: { platform: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    twitter: { label: "X", color: "#1da1f2" },
    linkedin: { label: "in", color: "#0a66c2" },
    tiktok: { label: "TT", color: "#ff0050" },
  };
  const p = labels[platform] ?? { label: "?", color: "#8b909c" };
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
      style={{ backgroundColor: p.color + "20", color: p.color }}
    >
      {p.label}
    </div>
  );
}

export default function SocialPage() {
  const totalFollowers = mockSocialAccounts.reduce((s: any, a: any) => s + a.followers, 0);
  const avgEngagement = (mockSocialAccounts.reduce((s: any, a: any) => s + a.engagement, 0) / mockSocialAccounts.length).toFixed(1);
  const totalImpressions = mockSocialAccounts.reduce((s: any, a: any) => s + a.impressions, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-sf-text">Social Stats</h1>
        <p className="text-xs text-sf-text-secondary">Synced daily across platforms</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Followers", value: totalFollowers.toLocaleString(), icon: Users, color: "text-sf-text" },
          { label: "Avg Engagement", value: `${avgEngagement}%`, icon: Heart, color: "text-sf-red" },
          { label: "Impressions/mo", value: `${(totalImpressions / 1000).toFixed(0)}k`, icon: Eye, color: "text-sf-accent" },
          { label: "Link Clicks", value: "3,241", icon: Link2, color: "text-sf-green" },
        ].map((stat: any) => (
          <div key={stat.label} className="rounded-lg border border-sf-border bg-sf-sidebar p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] font-medium uppercase tracking-wide text-sf-text-muted">{stat.label}</span>
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
            </div>
            <div className={`text-xl font-semibold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Platform rows */}
      <div className="rounded-lg border border-sf-border bg-sf-sidebar overflow-hidden">
        <div className="border-b border-sf-border px-4 py-2.5">
          <h2 className="text-[11px] font-medium uppercase tracking-wide text-sf-text-muted">By Platform</h2>
        </div>
        <div className="divide-y divide-sf-border/50">
          {mockSocialAccounts.map((acc: any) => (
            <div key={acc.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-sf-input/30 transition-colors">
              <PlatformIcon platform={acc.platform} />
              <div className="flex-1">
                <div className="text-xs font-medium text-sf-text capitalize">{acc.platform}</div>
                <div className="text-[10px] text-sf-text-muted">{acc.handle}</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-sm font-semibold text-sf-text">{acc.followers.toLocaleString()}</div>
                <div className="font-mono text-[9px] text-sf-text-muted">followers</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-sm font-semibold text-sf-text">{acc.engagement}%</div>
                <div className="font-mono text-[9px] text-sf-text-muted">engagement</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-sm font-semibold text-sf-text">{(acc.impressions / 1000).toFixed(0)}k</div>
                <div className="font-mono text-[9px] text-sf-text-muted">impressions</div>
              </div>
              <div className={`flex items-center gap-1 font-mono text-xs font-medium ${acc.weekChange > 0 ? "text-sf-green" : "text-sf-red"}`}>
                {acc.weekChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {acc.weekChange > 0 ? "+" : ""}{acc.weekChange}% w/w
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top post card */}
      <div className="rounded-lg border border-sf-border bg-sf-sidebar p-4">
        <div className="mb-3 font-mono text-[10px] font-medium uppercase tracking-wide text-sf-text-muted">
          Top Post This Month
        </div>
        <div className="flex items-start gap-3">
          <PlatformIcon platform="tiktok" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-sf-text">TikTok</span>
              <span className="font-mono text-[10px] text-sf-text-muted">Mar 8</span>
            </div>
            <p className="text-sm text-sf-text-secondary">
              "POV: you shipped a feature at 2am and your users noticed before you did 😅 The best part of building in public is never shipping alone."
            </p>
            <div className="flex items-center gap-4 mt-2">
              {[
                { label: "Likes", value: "12.4k" },
                { label: "Reposts", value: "847" },
                { label: "Views", value: "156k" },
              ].map((m: any) => (
                <div key={m.label} className="flex items-center gap-1">
                  <span className="font-mono text-xs font-semibold text-sf-text">{m.value}</span>
                  <span className="font-mono text-[10px] text-sf-text-muted">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
