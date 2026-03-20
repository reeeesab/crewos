import React from "react";
import { cn } from "@/lib/utils";

export type TicketType = "FEATURE" | "BUG" | "MARKETING" | "OTHER";

export const TICKET_CONFIG = {
  FEATURE: { emoji: "🚀", label: "Feature", bg: "#083344", text: "#22d3ee", borderColor: "border-l-brand-accent" },
  BUG: { emoji: "🐛", label: "Bug", bg: "#3f0011", text: "#fb7185", borderColor: "border-l-rose-500" },
  MARKETING: { emoji: "📣", label: "Marketing", bg: "#2e1065", text: "#c084fc", borderColor: "border-l-purple-500" },
  OTHER: { emoji: "🔧", label: "Other", bg: "#1e293b", text: "#94a3b8", borderColor: "border-l-slate-500" },
};

interface TicketBadgeProps {
  type: TicketType;
  className?: string;
  showEmoji?: boolean;
}

export function TicketBadge({ type, className, showEmoji = true }: TicketBadgeProps) {
  const config = TICKET_CONFIG[type];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        className
      )}
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {showEmoji && <span className="text-[12px] leading-none mb-0.5">{config.emoji}</span>}
      {config.label}
    </div>
  );
}
