"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  Bug,
  Sparkles,
  DollarSign,
  ChevronRight,
  GripVertical,
  Calendar,
  Tag,
  Edit3,
  CheckCircle2,
  LayoutGrid,
  Trophy,
  CalendarRange,
  ChevronDown,
} from "lucide-react";
import { TicketCard } from "@/components/board/ticket-card";
import { TicketBadge, TicketType } from "@/components/ui/ticket-badge";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/provider";
import { motion } from "framer-motion"; // Added for motion.div

type IssueType = "FEATURE" | "BUG" | "MARKETING" | "OTHER";
type IssuePriority = "P0" | "P1" | "P2" | "HIGH" | "MEDIUM" | "LOW";
type IssueStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

function formatMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

const COLUMNS: { key: IssueStatus; label: string; dotColor: string; bgColor: string }[] = [
  { key: "OPEN", label: "To Do", dotColor: "bg-brand-muted", bgColor: "bg-brand-bg/50" },
  { key: "IN_PROGRESS", label: "In Progress", dotColor: "bg-brand-accent", bgColor: "bg-brand-accent/5" },
  { key: "CLOSED", label: "Done", dotColor: "bg-emerald-500", bgColor: "bg-emerald-500/5" },
];

const PRIORITY_META: Record<IssuePriority, { label: string; bar: string; color: string }> = {
  P0: { label: "P0", bar: "bg-rose-500", color: "#F43F5E" },
  P1: { label: "P1", bar: "bg-amber-500", color: "#F59E0B" },
  P2: { label: "P2", bar: "bg-emerald-500", color: "#10B981" },
  HIGH: { label: "High", bar: "bg-rose-500", color: "#F43F5E" },
  MEDIUM: { label: "Med", bar: "bg-amber-500", color: "#F59E0B" },
  LOW: { label: "Low", bar: "bg-brand-muted", color: "#94A3B8" },
};

const TYPE_META: Record<IssueType, { label: string; icon: any; color: string; ring: string; border: string }> = {
  FEATURE: { label: "Feature", icon: Sparkles, color: "text-brand-accent", ring: "ring-brand-accent/20", border: "border-brand-accent" },
  BUG: { label: "Bug", icon: Bug, color: "text-rose-500", ring: "ring-rose-500/20", border: "border-rose-500" },
  MARKETING: { label: "Marketing", icon: Sparkles, color: "text-purple-500", ring: "ring-purple-500/20", border: "border-purple-500" },
  OTHER: { label: "Other", icon: Tag, color: "text-brand-muted", ring: "ring-brand-muted/20", border: "border-brand-muted" },
};

function getPriorityOrder(priority: IssuePriority) {
  const priorityOrder: IssuePriority[] = ["P0", "HIGH", "P1", "MEDIUM", "P2", "LOW"];
  return priorityOrder.indexOf(priority);
}

export function IssueCard({
  issue,
  idx,
  onClick,
  draggable = true,
}: {
  issue: any;
  idx: number;
  onClick: () => void;
  draggable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
    data: { issueId: issue.id, status: issue.status },
    disabled: !draggable,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
      className={cn(isDragging && "opacity-50 z-50 shadow-2xl scale-105 rotate-2")}
    >
      <TicketCard
        title={issue.title}
        type={issue.type as TicketType}
        points={issue.points || 0}
        priority={issue.priority as any}
        dueDate={issue.dueDate}
        assignee={issue.assignee ? {
          name: issue.assignee.name,
          email: issue.assignee.email,
          color: "#06b6d4" // Default for now
        } : undefined}
        onClick={onClick}
        isClosed={issue.status === "CLOSED"}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  issues,
  isUpdating,
  quickCreateOpen,
  quickCreateTitle,
  onQuickCreateOpen,
  onQuickCreateTitle,
  onQuickCreateSubmit,
  onOpenIssue,
  onStatusChange,
  onDelete,
  onEdit,
}: {
  column: (typeof COLUMNS)[number];
  issues: any[];
  isUpdating: boolean;
  quickCreateOpen: boolean;
  quickCreateTitle: string;
  onQuickCreateOpen: (status: IssueStatus) => void;
  onQuickCreateTitle: (value: string) => void;
  onQuickCreateSubmit: (status: IssueStatus) => void;
  onOpenIssue: (issue: any) => void;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (issue: any) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex min-h-[380px] flex-col overflow-hidden rounded-3xl border border-brand-border/50 shadow-lg backdrop-blur-sm",
        column.bgColor,
        isOver && "ring-2 ring-brand-primary/40",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-brand-bg opacity-20 mix-blend-overlay" />

      <div className="relative z-10 flex items-center justify-between border-b border-brand-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={cn("h-3 w-3 rounded-full blur-[1px] animate-pulse", column.dotColor)} />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">{column.label}</h3>
          <span className="rounded-lg border border-brand-border/50 bg-brand-bg/80 px-2.5 py-0.5 text-[10px] font-bold text-brand-muted">
            {issues.length}
          </span>
        </div>

        <button
          onClick={() => onQuickCreateOpen(column.key)}
          className="rounded-lg border border-transparent p-1.5 text-brand-muted transition-all hover:border-brand-border hover:bg-brand-surface hover:text-brand-primary"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="relative z-10 flex-1 space-y-3 overflow-y-auto p-4">
        {quickCreateOpen && (
          <div className="rounded-xl border border-brand-border/50 bg-brand-bg/60 p-3">
            <input
              value={quickCreateTitle}
              onChange={(e) => onQuickCreateTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onQuickCreateSubmit(column.key);
                if (e.key === "Escape") onQuickCreateOpen(null as any); // Close quick create
              }}
              placeholder={`Quick add to ${column.label}...`}
              className="w-full rounded-lg border border-brand-border/50 bg-brand-bg/70 px-3 py-2 text-sm text-brand-primary focus:border-brand-accent focus:outline-none"
              autoFocus
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => onQuickCreateSubmit(column.key)}
                className="rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-accent/90"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {issues.length === 0 && !quickCreateOpen && (
          <button
            onClick={() => onQuickCreateOpen(column.key)}
            className="flex w-full items-center justify-center rounded-2xl border border-dashed border-brand-border/70 bg-brand-bg/30 px-4 py-10 text-sm font-semibold text-brand-muted hover:border-brand-accent/50 hover:text-brand-primary"
          >
            + Add issue
          </button>
        )}

        {issues.map((issue, idx) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            idx={idx}
            onClick={() => onOpenIssue(issue)}
          />
        ))}
      </div>
    </div>
  );
}

interface IssueForm {
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  points: number;
  dueDate: string;
  milestone: string;
  assigneeId: string;
}

function IssueModal({
  mode,
  issue,
  members,
  onClose,
  onSubmit,
  isPending,
  error,
  userId, // Added userId prop
}: {
  mode: "create" | "edit";
  issue?: any;
  members: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  error?: string;
  userId: string; // Added userId prop type
}) {
  const [localError, setLocalError] = useState<string>("");
  const [form, setForm] = useState<IssueForm>({
    title: issue?.title || "",
    description: issue?.description || "",
    type: (issue?.type || "FEATURE") as IssueType,
    priority: (issue?.priority || "MEDIUM") as IssuePriority,
    points: issue?.points || 0,
    dueDate: issue?.dueDate ? new Date(issue.dueDate).toISOString().split("T")[0] : "",
    milestone: issue?.milestone || "",
    assigneeId: issue?.assigneeId || "",
  });

  useEffect(() => {
    if (userId && !form.assigneeId && !issue) {
      // Default to "me" for new tickets if available
      // or at least make sure the "Assign to me" option works
    }
  }, [userId]);

  const handleSubmit = () => { // Renamed submit to handleSubmit
    const title = form.title.trim();
    const description = form.description.trim();
    if (description && title.toLowerCase() === description.toLowerCase()) {
      setLocalError("Your description seems the same as your title — add more detail.");
      return;
    }
    setLocalError("");
    onSubmit({ ...form, title, description });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080B12]/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative my-auto w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-neutral-900 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent shadow-[0_4px_12px_rgba(6,182,212,0.4)]" />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight text-white">{mode === "create" ? "Create New Ticket" : "Edit Ticket"}</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">PLANNING & EXECUTION</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/5 bg-white/5 p-2 text-slate-500 transition-all hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            <div className="space-y-5">
            {/* Row 1: Title */}
            <div>
              <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Title</label>
              <input
                required
                // fullWidth // This is not a standard HTML attribute, removed.
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-10 w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 text-base font-bold text-white placeholder-slate-600 outline-none transition-all focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
                placeholder="What needs to be done?"
              />
            </div>

            {/* Row 2: Description */}
            <div>
              <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 p-4 text-sm font-medium text-white placeholder-slate-600 outline-none transition-all focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
                placeholder="Details of the task..."
              />
            </div>

            {/* Row 3: Type Selector */}
            <div>
              <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Ticket Type</label>
              <div className="grid grid-cols-4 gap-2.5">
                {(["FEATURE", "BUG", "MARKETING", "OTHER"] as const).map((t) => {
                  const meta = TYPE_META[t];
                  const Icon = meta.icon;
                  const isSelected = form.type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 border-2 transition-all",
                        isSelected
                          ? cn(
                              t === "FEATURE" ? "bg-brand-accent/40 border-brand-accent text-brand-accent shadow-[0_0_20px_rgba(6,182,212,0.15)]" :
                              t === "BUG" ? "bg-rose-950/40 border-rose-500 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]" :
                              t === "MARKETING" ? "bg-purple-950/40 border-purple-500 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]" :
                              "bg-slate-800/40 border-slate-500 text-slate-300 shadow-[0_0_20px_rgba(148,163,184,0.15)]"
                            )
                          : "border-neutral-700 bg-neutral-800 text-slate-500 hover:border-neutral-600 hover:text-white"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Points | Priority */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Points Reward</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
                  className="h-10 w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 text-sm font-black text-white outline-none focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
                />
                <div className="mt-2.5 flex gap-1 flex-wrap">
                  {[1, 3, 5, 8, 13].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm({ ...form, points: v })}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[9px] font-black transition-all",
                        form.points === v
                          ? "bg-brand-accent/10 border-brand-accent text-brand-accent shadow-[0_0_10px_rgba(0,212,255,0.1)]"
                          : "bg-neutral-800 border-neutral-700 text-slate-500 hover:border-neutral-600 hover:text-white"
                      )}
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Priority</label>
                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      {(["LOW", "MEDIUM", "HIGH"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm({ ...form, priority: p })}
                          className={cn(
                             "flex h-10 items-center justify-center rounded-xl border-2 transition-all text-[9px] font-black uppercase tracking-widest",
                             form.priority === p
                               ? p === "HIGH" ? "bg-rose-950/40 border-rose-500 text-rose-500" :
                                 p === "MEDIUM" ? "bg-amber-950/40 border-amber-500 text-amber-500" :
                                 "bg-emerald-950/40 border-emerald-500 text-emerald-500"
                               : "border-brand-border bg-brand-bg text-brand-muted hover:text-white"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                </div>
              </div>
            </div>

            {/* Row 5: Assignee | Due Date */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Assignee</label>
                <div className="relative">
                  <select
                    value={form.assigneeId}
                    onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                    className="h-10 w-full appearance-none rounded-xl border border-brand-border bg-brand-surface px-4 pr-10 text-sm font-bold text-white outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  >
                    <option value="" className="bg-brand-bg">Unassigned</option>
                    <option value={userId || ""} className="bg-brand-bg font-bold text-brand-accent italic">Assign to me</option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.user.id} className="bg-brand-bg">
                        {m.user.name || m.user.email}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="h-10 w-full rounded-xl border border-brand-border bg-brand-surface px-4 text-sm font-bold text-white outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Row 6: Milestone (Optional) */}
            <Collapsible>
               <CollapsibleTrigger className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors py-1.5">
                  Advanced options <ChevronDown className="h-3 w-3" />
               </CollapsibleTrigger>
               <CollapsibleContent className="mt-3">
                  <div>
                    <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Milestone</label>
                    <input
                      value={form.milestone}
                      onChange={(e) => setForm({ ...form, milestone: e.target.value })}
                      className="h-10 w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 text-sm font-bold text-white outline-none focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
                      placeholder="e.g. Q1 Release"
                    />
                  </div>
               </CollapsibleContent>
            </Collapsible>
          </div>

          {(error || localError) && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs font-semibold text-rose-500">
              <AlertCircle className="h-3 w-3" />
              {localError || error}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-brand-surface-2 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-brand-muted transition-all hover:bg-brand-surface hover:text-white shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-[2] rounded-xl bg-gradient-to-r from-brand-primary to-blue-600 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_10px_25px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (mode === "create" ? <Plus className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />)}
              {mode === "create" ? "Create Ticket" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function GanttTimeline({ issues, onOpenIssue }: { issues: any[]; onOpenIssue: (issue: any) => void }) {
  const timelineIssues = issues
    .filter((issue) => issue.dueDate)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (timelineIssues.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-border p-12 text-center">
        <Calendar className="mx-auto mb-3 h-8 w-8 text-brand-muted opacity-30" />
        <p className="text-sm text-brand-muted">No scheduled issues yet. Add due dates to see the timeline.</p>
      </div>
    );
  }

  const minStart = new Date(
    Math.min(...timelineIssues.map((issue) => new Date(issue.createdAt).getTime())),
  );
  const maxEnd = new Date(
    Math.max(...timelineIssues.map((issue) => new Date(issue.dueDate).getTime())),
  );
  const totalDays = Math.max(1, Math.ceil((maxEnd.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-brand-muted">
        <span>Timeline Start</span>
        <span>Timeline End</span>
      </div>
      <div className="space-y-4">
        {timelineIssues.map((issue) => {
          const start = new Date(issue.createdAt);
          const end = new Date(issue.dueDate);
          const left = ((start.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
          const width = Math.max(
            3,
            ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1) / totalDays * 100,
          );

          return (
            <div key={issue.id} className="grid grid-cols-[200px_1fr] items-center gap-4">
              <button
                onClick={() => onOpenIssue(issue)}
                className="truncate text-left text-[13px] font-medium text-brand-text hover:text-brand-accent transition-colors"
              >
                {issue.title}
              </button>
              <div className="relative h-6 rounded-full bg-brand-bg/50 overflow-hidden border border-brand-border/30">
                <button
                  onClick={() => onOpenIssue(issue)}
                  className={cn(
                    "absolute top-0 h-full rounded-full transition-opacity hover:opacity-90 shadow-sm",
                    issue.type === "BUG" ? "bg-rose-500" : 
                    issue.type === "MARKETING" ? "bg-purple-500" :
                    "bg-brand-accent"
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${new Date(issue.createdAt).toLocaleDateString()} → ${new Date(issue.dueDate).toLocaleDateString()}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function IssueDetailSheet({
  issue,
  open,
  onOpenChange,
  onStatusChange,
  onEdit,
  onDelete,
  isUpdating,
}: {
  issue: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onEdit: (issue: any) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        {issue ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl font-bold text-white">{issue.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <TicketBadge type={issue.type as TicketType} />
                <span className="h-1 w-1 rounded-full bg-brand-border" />
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">
                  {PRIORITY_META[issue.priority as IssuePriority]?.label || issue.priority} Priority
                </span>
              </div>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                <p className="text-sm leading-relaxed text-brand-text">{issue.description || "No description"}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-brand-border bg-brand-bg/50 p-3">
                  <p className="text-brand-muted text-[10px] uppercase font-bold tracking-tight">Status</p>
                  <p className="mt-1 font-bold text-white uppercase text-[11px]">{issue.status.replace("_", " ")}</p>
                </div>
                <div className="rounded-lg border border-brand-border bg-brand-bg/50 p-3">
                  <p className="text-brand-muted text-[10px] uppercase font-bold tracking-tight">Reward</p>
                  <p className="mt-1 font-bold text-brand-accent">{issue.points || 0} pts</p>
                </div>
                <div className="rounded-lg border border-brand-border bg-brand-bg/50 p-3">
                  <p className="text-brand-muted text-[10px] uppercase font-bold tracking-tight">Due Date</p>
                  <p className="mt-1 font-bold text-white">
                    {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {issue.status !== "IN_PROGRESS" && (
                  <button
                    onClick={() => onStatusChange(issue.id, "IN_PROGRESS")}
                    disabled={isUpdating}
                    className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-accent hover:bg-brand-accent/20 transition-colors"
                  >
                    Start Working
                  </button>
                )}
                {issue.status !== "CLOSED" && (
                  <button
                    onClick={() => onStatusChange(issue.id, "CLOSED")}
                    disabled={isUpdating}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    Complete
                  </button>
                )}
                {issue.status === "CLOSED" && (
                  <button
                    onClick={() => onStatusChange(issue.id, "OPEN")}
                    disabled={isUpdating}
                    className="rounded-lg border border-brand-border bg-brand-surface-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-muted hover:text-white transition-colors"
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => onEdit(issue)}
                  className="rounded-lg border border-brand-border bg-brand-surface-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-muted hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(issue.id)}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default function RoadmapPage() {
  const { userId } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.productId as string;

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "features" | "bugs" | "marketing" | "other">("all");
  const [view, setView] = useState<"board" | "timeline">("board");
  const [quickColumn, setQuickColumn] = useState<IssueStatus | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  useEffect(() => {
    const queryFilter = searchParams.get("filter");
    if (["all", "features", "bugs", "marketing", "other"].includes(queryFilter || "")) {
      setFilter(queryFilter as any);
    }
  }, [searchParams]);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const utils = trpc.useUtils();
  const { data: issues, isLoading } = trpc.issue.list.useQuery({ productId });
  const { data: members } = trpc.product.listMembers.useQuery({ productId });
  const me = members?.find((m: any) => m.user.clerkId === userId);
  const myInternalId = me?.user?.id;

  const createIssue = trpc.issue.create.useMutation({
    onSuccess: () => {
      utils.issue.list.invalidate({ productId });
      setModalMode(null);
      setQuickTitle("");
      setQuickColumn(null);
    },
  });

  const updateIssue = trpc.issue.update.useMutation({
    onSuccess: () => {
      utils.issue.list.invalidate({ productId });
      setModalMode(null);
      setEditingIssue(null);
    },
  });

  const generateChangelog = trpc.changelog.generate.useMutation();

  const updateStatus = trpc.issue.updateStatus.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.issue.list.invalidate({ productId });
      if (variables.status === "CLOSED") {
        generateChangelog.mutate(
          { productId },
          {
            onSuccess: () => {
              setToast("Moved to Done · changelog draft created →");
              setTimeout(() => setToast(""), 2800);
            },
            onError: () => {
              setToast("Moved to Done");
              setTimeout(() => setToast(""), 2200);
            },
          },
        );
      }
    },
  });

  const deleteIssue = trpc.issue.delete.useMutation({
    onSuccess: () => utils.issue.list.invalidate({ productId }),
  });

  const allIssues = issues ?? [];
  const filteredIssues = allIssues.filter((issue: any) => {
    if (filter === "features") return issue.type === "FEATURE";
    if (filter === "bugs") return issue.type === "BUG";
    if (filter === "marketing") return issue.type === "MARKETING";
    if (filter === "other") return issue.type === "OTHER";
    return true;
  });

  const activeIssue = useMemo(
    () => allIssues.find((issue: any) => issue.id === activeIssueId) || null,
    [allIssues, activeIssueId],
  );

  const featuresCount = allIssues.filter((i: any) => i.type === "FEATURE" && i.status !== "CLOSED").length;
  const bugsCount = allIssues.filter((i: any) => i.type === "BUG" && i.status !== "CLOSED").length;
  const marketingCount = allIssues.filter((i: any) => i.type === "MARKETING" && i.status !== "CLOSED").length;
  const otherCount = allIssues.filter((i: any) => i.type === "OTHER" && i.status !== "CLOSED").length;
  const closedCount = allIssues.filter((i: any) => i.status === "CLOSED").length;

  function handleStatusChange(id: string, status: IssueStatus) {
    updateStatus.mutate({ id, status });
  }

  function handleDelete(id: string) {
    if (confirm("Delete this issue?")) deleteIssue.mutate({ id });
  }

  function handleEdit(issue: any) {
    setEditingIssue(issue);
    setModalMode("edit");
    setSelectedIssue(null);
  }

  function handleModalSubmit(data: any) {
    if (modalMode === "create") {
      createIssue.mutate({ productId, ...data });
    } else if (modalMode === "edit" && editingIssue) {
      updateIssue.mutate({ id: editingIssue.id, ...data });
    }
  }

  function openQuickCreate(column: IssueStatus) {
    setQuickColumn(column);
    setQuickTitle("");
  }

  function submitQuickCreate(column: IssueStatus) {
    const title = quickTitle.trim();
    if (!title) return;
    createIssue.mutate({
      productId,
      title,
      description: "",
      type: "FEATURE",
      priority: "MEDIUM",
      status: column,
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveIssueId(null);
    if (!over) return;
    const issueId = String(active.id);
    const targetStatus = String(over.id) as IssueStatus;
    const issue = allIssues.find((it: any) => it.id === issueId);
    if (!issue || !["OPEN", "IN_PROGRESS", "CLOSED"].includes(targetStatus)) return;
    if (issue.status === targetStatus) return;
    handleStatusChange(issueId, targetStatus);
  }

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
          <h1 className="text-2xl font-bold tracking-tight text-white mb-3">Board</h1>
          <div className="flex flex-wrap items-center gap-3">
            <TicketBadge type="FEATURE" className="shadow-sm" />
            <TicketBadge type="BUG" className="shadow-sm" />
            <TicketBadge type="MARKETING" className="shadow-sm" />
            <span className="inline-flex items-center gap-2 rounded-full bg-green-950/30 px-3 py-1 text-[10px] font-bold text-green-400 border border-green-800/50 uppercase tracking-widest shadow-sm">
               <CheckCircle2 className="h-3.5 w-3.5" /> {closedCount} Shipped
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 rounded-xl bg-brand-surface-2/40 p-1 border border-brand-border/30">
            {[
              { id: "board" as const, label: "Board", icon: LayoutGrid },
              { id: "timeline" as const, label: "Timeline", icon: CalendarRange },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all",
                  view === id
                    ? "bg-white/10 text-white shadow-xl"
                    : "text-slate-500 hover:text-white hover:bg-white/5",
                )}
              >
                {label}
                {view === id && (
                  <div className="absolute -bottom-1 left-4 right-4 h-[2px] bg-brand-accent rounded-full shadow-[0_0_8px_#06b6d4]" />
                )}
              </button>
            ))}
          </div>
           <div className="flex gap-1.5 rounded-xl border border-brand-border/30 bg-brand-surface-2/40 p-1 shadow-lg">
            {[
              { key: "all" as const, label: "All" },
              { key: "features" as const, label: "Features", count: featuresCount },
              { key: "bugs" as const, label: "Bugs", count: bugsCount },
              { key: "marketing" as const, label: "Marketing", count: marketingCount },
              { key: "other" as const, label: "Other", count: otherCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === key
                    ? "bg-brand-accent text-white shadow-[0_4px_12px_rgba(6,182,212,0.2)]"
                    : "text-slate-500 hover:text-white hover:bg-white/5",
                )}
              >
                {label}
                {count !== undefined && (
                  <span className={cn(
                    "ml-1 rounded-md px-1.5 py-0.5 text-[9px] font-black",
                    filter === key ? "bg-white/20 text-white" : "bg-white/5 text-slate-500"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setModalMode("create")}
            className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold tracking-tight text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-brand-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </button>
        </div>
      </div>

      {view === "board" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveIssueId(String(event.active.id))}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveIssueId(null)}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {COLUMNS.map((column) => {
              const columnIssues = filteredIssues
                .filter((issue: any) => issue.status === column.key)
                .sort((a: any, b: any) => {
                  const diff = getPriorityOrder(a.priority as IssuePriority) - getPriorityOrder(b.priority as IssuePriority);
                  if (diff !== 0) return diff;
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

              return (
                <KanbanColumn
                  key={column.key}
                  column={column}
                  issues={columnIssues}
                  isUpdating={updateStatus.isPending}
                  quickCreateOpen={quickColumn === column.key}
                  quickCreateTitle={quickColumn === column.key ? quickTitle : ""}
                  onQuickCreateOpen={() => openQuickCreate(column.key)}
                  onQuickCreateTitle={setQuickTitle}
                  onQuickCreateSubmit={() => submitQuickCreate(column.key)}
                  onOpenIssue={(issue) => setSelectedIssue(issue)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeIssue ? (
              <div className="w-[320px]">
                <DraggableIssueCard
                  issue={activeIssue}
                  isUpdating={false}
                  onOpen={() => {}}
                  onStatusChange={() => {}}
                  onDelete={() => {}}
                  onEdit={() => {}}
                  draggable={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {view === "timeline" && (
        <GanttTimeline issues={filteredIssues} onOpenIssue={(issue) => setSelectedIssue(issue)} />
      )}

      {modalMode && (
        <IssueModal
          mode={modalMode}
          issue={modalMode === "edit" ? editingIssue : undefined}
          members={members || []}
          userId={myInternalId || ""}
          onClose={() => {
            setModalMode(null);
            setEditingIssue(null);
          }}
          onSubmit={handleModalSubmit}
          isPending={createIssue.isPending || updateIssue.isPending}
          error={createIssue.error?.message || updateIssue.error?.message}
        />
      )}

      <IssueDetailSheet
        issue={selectedIssue}
        open={Boolean(selectedIssue)}
        onOpenChange={(open) => {
          if (!open) setSelectedIssue(null);
        }}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isUpdating={updateStatus.isPending}
      />

      {toast && (
        <button
          onClick={() => router.push(`/${productId}/changelog`)}
          className="fixed bottom-6 right-6 z-50 rounded-xl border border-brand-accent/40 bg-brand-accent/15 px-4 py-2 text-sm font-semibold text-brand-accent shadow-xl"
        >
          {toast}
        </button>
      )}
    </div>
  );
}
