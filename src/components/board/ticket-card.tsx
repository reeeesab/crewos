import React from "react";
import { cn } from "@/lib/utils";
import { TicketBadge, TicketType, TICKET_CONFIG } from "@/components/ui/ticket-badge";
import { Calendar, UserCircle } from "lucide-react";

interface TicketCardProps {
  title: string;
  type: TicketType;
  points: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | Date;
  assignee?: {
    name?: string | null;
    email?: string | null;
    color?: string;
  };
  className?: string;
  onClick?: () => void;
  isClosed?: boolean;
}

export function TicketCard({
  title,
  type,
  points,
  priority,
  dueDate,
  assignee,
  className,
  onClick,
  isClosed = false,
}: TicketCardProps) {
  const config = TICKET_CONFIG[type];
  
  const priorityColor = {
    LOW: "#22c55e",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
  }[priority];

  const formattedDate = dueDate 
    ? new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const initials = assignee?.name 
    ? assignee.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : assignee?.email?.charAt(0).toUpperCase() || "??";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-3 rounded-[10px] border border-brand-border bg-brand-surface p-4 transition-all hover:bg-[#1a2540] hover:scale-[1.01] cursor-pointer shadow-sm",
        config.borderColor,
        "border-l-[3px]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <TicketBadge type={type} />
        <div className="rounded-md bg-[#0d2137] px-2 py-0.5 font-mono text-[10px] font-bold text-brand-accent">
          {points} PT
        </div>
      </div>

      <h4 className={cn(
        "text-[13px] font-medium leading-snug text-brand-text line-clamp-2",
        isClosed && "text-brand-muted line-through opacity-60"
      )}>
        {title}
      </h4>
      
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <div 
              className="h-1.5 w-1.5 rounded-full" 
              style={{ backgroundColor: priorityColor }}
            />
            <span className="text-[11px] text-brand-muted font-medium">
              {priority === "LOW" ? "Low" : priority === "MEDIUM" ? "Medium" : "High"} priority
            </span>
          </div>
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-brand-muted">
              <Calendar className="h-3 w-3" />
              <span className="text-[11px] font-medium">Due {formattedDate}</span>
            </div>
          )}
        </div>

        <div className="flex items-center shrink-0">
          {assignee ? (
            <div 
              className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-border text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: assignee.color || "#1e2938" }}
              title={assignee.name || assignee.email || "Assignee"}
            >
              {initials}
            </div>
          ) : (
            <UserCircle className="h-6 w-6 text-brand-muted/50" />
          )}
        </div>
      </div>
    </div>
  );
}
