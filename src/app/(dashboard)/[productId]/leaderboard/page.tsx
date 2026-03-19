"use client";

import { useParams } from "next/navigation";
import { Loader2, Trophy, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc/provider";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const params = useParams();
  const productId = params.productId as string;

  const { data: leaderboard, isLoading } = trpc.issue.getLeaderboard.useQuery({ productId });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sf-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Leaderboard</h1>
          <p className="text-sm text-sf-text-muted">Ranked by contribution points across the team.</p>
        </div>
      </div>

      {!leaderboard || leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-sf-border-subtle bg-sf-elevated/30 p-20 text-center shadow-xl backdrop-blur-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sf-accent-cyan/10 mb-6 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
             <Trophy className="h-10 w-10 text-sf-accent-cyan animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No points yet</h3>
          <p className="max-w-xs text-sm text-sf-text-muted leading-relaxed">
            Complete tickets to earn points and climb the board. The more you ship, the higher you rank.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-sf-border-subtle bg-sf-elevated/50 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Trophy className="h-6 w-6 text-sf-amber" />
                <div className="absolute inset-0 h-6 w-6 animate-ping rounded-full bg-sf-amber/20" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Team Rankings</h3>
            </div>
            <div className="rounded-xl border border-sf-border-subtle bg-sf-base/50 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-sf-text-muted">
              MVP RANKING
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-sf-border-subtle bg-[#0B0E14]/40">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0D1117] text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                <tr className="border-b border-white/5">
                  <th className="px-6 py-5">Rank</th>
                  <th className="px-6 py-5">Member</th>
                  <th className="px-6 py-5 text-center">Reward Points</th>
                  <th className="px-6 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.map((row: any, i: number) => (
                  <tr key={row.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-6">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl font-mono text-xs font-black",
                        i === 0 ? "bg-sf-amber/20 text-sf-amber shadow-[0_0_15px_rgba(245,158,11,0.2)]" : 
                        i === 1 ? "bg-slate-300/10 text-slate-300" :
                        i === 2 ? "bg-orange-400/10 text-orange-400" : "bg-sf-base/40 text-sf-text-muted"
                      )}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="px-6 py-6 font-medium">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl border border-sf-border-subtle bg-sf-base p-0.5 flex items-center justify-center text-sf-accent-cyan font-bold text-sm ring-2 ring-transparent group-hover:ring-sf-accent-cyan/20 transition-all">
                          {row.user.name?.charAt(0) || row.user.email?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-sf-accent-cyan transition-colors">{row.user.name || row.user.email}</p>
                          <p className="text-[10px] text-sf-text-muted mt-0.5 font-medium">{row.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sf-accent-cyan/10 px-4 py-1.5 text-xs font-black text-sf-accent-cyan border border-sf-accent-cyan/20 shadow-sm">
                        <Sparkles className="h-3 w-3" />
                        {row.points} PTS
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                         <div className="h-1 w-1 rounded-full bg-sf-accent-cyan animate-pulse" />
                         Contributor
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
