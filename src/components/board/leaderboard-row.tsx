import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface LeaderboardRowProps {
  rank: number;
  userName: string;
  userEmail: string;
  points: number;
  ticketCount: number;
  className?: string;
}

export function LeaderboardRow({
  rank,
  userName,
  userEmail,
  points,
  ticketCount,
  className,
}: LeaderboardRowProps) {
  const isTopThree = rank <= 3;
  
  const rankConfig = {
    1: { bg: "#422006", text: "#fbbf24", icon: "👑" },
    2: { bg: "#1e2938", text: "#94a3b8", icon: null },
    3: { bg: "#2c1810", text: "#d97706", icon: null },
  }[rank as 1 | 2 | 3] || { bg: "transparent", text: "#64748b", icon: null };

  const initials = userName
    ? userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : userEmail.charAt(0).toUpperCase();

  return (
    <div className={cn(
      "group flex items-center gap-4 rounded-xl border border-brand-border bg-brand-surface p-4 transition-all hover:bg-brand-surface-2",
      className
    )}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold shadow-sm",
        rank === 1 ? "bg-amber-900/40 text-amber-500 border border-amber-800/50" :
        rank === 2 ? "bg-slate-800/40 text-slate-400 border border-slate-700/50" :
        rank === 3 ? "bg-orange-900/40 text-orange-600 border border-orange-800/50" :
        "bg-brand-bg text-brand-muted"
      )}>
        {rank}
      </div>

      <div className="relative">
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-border bg-[#1e2938] text-xs font-bold text-white group-hover:border-brand-accent transition-colors shadow-md"
        >
          {initials}
        </div>
        {rank === 1 && (
          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] shadow-lg border border-amber-900">
            {rankConfig.icon}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <h4 className="truncate text-sm font-bold text-brand-text group-hover:text-brand-accent transition-colors">
          {userName || userEmail}
        </h4>
        <p className="text-[11px] text-brand-muted font-medium">
          {ticketCount} tickets completed
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className={cn(
          "font-mono font-bold tracking-tight",
          rank === 1 ? "text-lg text-brand-accent" : "text-base text-brand-text"
        )}>
          {points.toLocaleString()} <span className="text-[10px] text-brand-muted uppercase tracking-widest ml-1">pts</span>
        </div>
        {rank === 1 && (
          <div className="flex items-center gap-1 rounded-full bg-brand-accent/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-brand-accent border border-brand-accent/20">
            <Sparkles className="h-2.5 w-2.5" />
            Leading
          </div>
        )}
      </div>
    </div>
  );
}
