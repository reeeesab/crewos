"use client";

import { useParams } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc/provider";
import { cn } from "@/lib/utils";
import { LeaderboardRow } from "@/components/board/leaderboard-row";

export default function LeaderboardPage() {
  const params = useParams();
  const productId = params.productId as string;

  const { data: leaderboard, isLoading } = trpc.issue.getLeaderboard.useQuery({ productId });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Leaderboard</h1>
          <p className="text-sm text-brand-muted">Ranked by contribution points across the team.</p>
        </div>
      </div>

      {!leaderboard || leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-border bg-brand-surface/30 p-20 text-center shadow-xl backdrop-blur-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10 mb-6 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
             <Trophy className="h-10 w-10 text-brand-primary animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No points yet</h3>
          <p className="max-w-xs text-sm text-brand-muted leading-relaxed">
            Complete tickets to earn points and climb the board. The more you ship, the higher you rank.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-brand-border bg-brand-surface/50 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Trophy className="h-6 w-6 text-amber-500" />
                <div className="absolute inset-0 h-6 w-6 animate-ping rounded-full bg-amber-500/20" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Team Rankings</h3>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-bg/50 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-brand-muted">
              MVP RANKING
            </div>
          </div>

        <div className="space-y-3">
          {leaderboard.map((row: any, i: number) => (
            <LeaderboardRow
              key={row.id}
              rank={i + 1}
              userName={row.user.name || ""}
              userEmail={row.user.email || ""}
              points={row.points}
              ticketCount={row.ticketCount || 0}
            />
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
