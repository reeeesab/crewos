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
  { key: "OPEN", label: "To Do", dotColor: "bg-sf-text-muted", bgColor: "bg-[#0D1117]/50" },
  { key: "IN_PROGRESS", label: "In Progress", dotColor: "bg-[#00D4FF]", bgColor: "bg-[#00D4FF]/5" },
  { key: "CLOSED", label: "Done", dotColor: "bg-sf-green", bgColor: "bg-sf-green/5" },
];

const PRIORITY_META: Record<IssuePriority, { label: string; bar: string; color: string }> = {
  P0: { label: "P0", bar: "bg-sf-red", color: "#EF4444" },
  P1: { label: "P1", bar: "bg-sf-amber", color: "#F59E0B" },
  P2: { label: "P2", bar: "bg-sf-accent-emerald", color: "#10B981" },
  HIGH: { label: "High", bar: "bg-sf-red", color: "#EF4444" },
  MEDIUM: { label: "Med", bar: "bg-sf-amber", color: "#F59E0B" },
  LOW: { label: "Low", bar: "bg-sf-text-muted", color: "#94A3B8" },
};

const TYPE_META: Record<IssueType, { label: string; icon: any; color: string; ring: string; border: string }> = {
  FEATURE: { label: "Feature", icon: Sparkles, color: "text-sf-accent-cyan", ring: "ring-sf-accent-cyan/20", border: "border-sf-accent-cyan" },
  BUG: { label: "Bug", icon: Bug, color: "text-sf-red", ring: "ring-sf-red/20", border: "border-sf-red" },
  MARKETING: { label: "Marketing", icon: Sparkles, color: "text-sf-purple", ring: "ring-sf-purple/20", border: "border-sf-purple" },
  OTHER: { label: "Other", icon: Tag, color: "text-sf-text-muted", ring: "ring-sf-text-muted/20", border: "border-sf-text-muted" },
};

function getPriorityOrder(priority: IssuePriority) {
  const priorityOrder: IssuePriority[] = ["P0", "HIGH", "P1", "MEDIUM", "P2", "LOW"];
  return priorityOrder.indexOf(priority);
}

function DraggableIssueCard({
  issue,
  isUpdating,
  onOpen,
  onStatusChange,
  onDelete,
  onEdit,
  draggable = true,
}: {
  issue: any;
  isUpdating: boolean;
  onOpen: (issue: any) => void;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (issue: any) => void;
  draggable?: boolean;
}) {
  const draggableState = useDraggable({
    id: issue.id,
    data: { issueId: issue.id, status: issue.status },
    disabled: !draggable,
  });

  const { attributes, listeners, setNodeRef, transform, isDragging } = draggableState;

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const typeMeta = TYPE_META[issue.type as IssueType] ?? TYPE_META.FEATURE;
  const priority = PRIORITY_META[issue.priority as IssuePriority] ?? PRIORITY_META.MEDIUM;
  const isClosed = issue.status === "CLOSED";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(issue)}
      className={cn(
        "group relative rounded-2xl border border-sf-border-subtle bg-slate-800/40 p-5 shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-slate-800/60 hover:shadow-2xl cursor-pointer",
        isDragging && "opacity-60 scale-95",
      )}
    >
      {/* Type-based left border */}
      <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-all group-hover:top-2 group-hover:bottom-2", typeMeta.border.replace('border-', 'bg-'))} />

      <div style={{ opacity: isClosed ? 0.6 : 1 }}>
        <div className="mb-3 flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                typeMeta.border,
                typeMeta.color,
                "bg-sf-base/40"
              )}
            >
              <typeMeta.icon className="h-3 w-3" />
              {typeMeta.label}
            </span>

            {/* Priority Dot */}
            <span className="flex items-center gap-1.5 rounded-lg bg-sf-base/40 px-2 py-1 text-[10px] font-bold text-sf-text-secondary border border-sf-border-subtle">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priority.color }} />
              {priority.label}
            </span>
          </div>

          {/* Points Badge (Top Right) */}
          <div className="flex flex-col items-end gap-2">
             <div className="rounded-lg bg-sf-accent-cyan/10 border border-sf-accent-cyan/20 px-2 py-1 text-[10px] font-bold text-sf-accent-cyan">
               {issue.points || 0} pts
             </div>
             <button
               onClick={(e) => e.stopPropagation()}
               className="rounded-md p-1 text-sf-text-muted hover:text-white cursor-grab active:cursor-grabbing transition-colors"
               {...(draggable ? listeners : {})}
               {...(draggable ? attributes : {})}
               aria-label="Drag issue"
             >
               <GripVertical className="h-4 w-4" />
             </button>
          </div>
        </div>

        <h4 className={cn("text-sm font-bold leading-snug text-white group-hover:text-sf-accent-cyan transition-colors", isClosed && "line-through text-sf-text-muted")}>
          {issue.title}
        </h4>

        {issue.description && (
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-sf-text-muted">
            {issue.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-sf-border-subtle/40 pt-3">
          <div className="flex items-center gap-3">
            {issue.dueDate && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-sf-text-secondary">
                <Calendar className="h-3 w-3" />
                {new Date(issue.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
            {issue.costs && issue.costs.length > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-sf-green/10 px-1.5 py-0.5 text-[10px] font-bold text-sf-green border border-sf-green/20">
                <DollarSign className="h-2.5 w-2.5" />
                {formatMoney(issue.costs.reduce((s: number, c: any) => s + c.amount, 0))}
              </span>
            )}
          </div>

          {/* Assignee Avatar (Bottom Right) */}
          {issue.assignee ? (
            <div className="group/avatar relative">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-sf-accent-cyan/30 bg-sf-accent-cyan/10 text-[10px] font-bold text-sf-accent-cyan shadow-sm ring-2 ring-transparent group-hover/avatar:ring-sf-accent-cyan/20 transition-all">
                {(issue.assignee.name || issue.assignee.email).charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-full right-0 mb-2 invisible group-hover/avatar:visible opacity-0 group-hover/avatar:opacity-100 transition-all whitespace-nowrap rounded-md bg-sf-elevated border border-sf-border-subtle px-2 py-1 text-[9px] font-bold text-white shadow-xl">
                {issue.assignee.name || issue.assignee.email}
              </div>
            </div>
          ) : (
            <div className="h-6 w-6 rounded-lg border border-dashed border-sf-border-subtle bg-sf-base/40 flex items-center justify-center">
               <Plus className="h-2.5 w-2.5 text-sf-text-muted" />
            </div>
          )}
        </div>

        <div className="z-10 mt-4 flex items-center gap-1.5 border-t border-sf-border-subtle/40 pt-4" onClick={(e) => e.stopPropagation()}>
          {issue.status === "OPEN" && (
            <button
              onClick={() => onStatusChange(issue.id, "IN_PROGRESS")}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 rounded-lg border border-sf-accent-cyan/30 bg-sf-accent-cyan/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-accent-cyan hover:bg-sf-accent-cyan/20 disabled:opacity-50 transition-all"
            >
              <ChevronRight className="h-3 w-3" />
              Start
            </button>
          )}

          {issue.status === "IN_PROGRESS" && (
            <>
              <button
                onClick={() => onStatusChange(issue.id, "CLOSED")}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 rounded-lg border border-sf-green/30 bg-sf-green/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-green hover:bg-sf-green/20 disabled:opacity-50 transition-all"
              >
                <CheckCircle2 className="h-3 w-3" />
                Done
              </button>
              <button
                onClick={() => onStatusChange(issue.id, "OPEN")}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-text-secondary hover:text-white disabled:opacity-50 transition-all"
              >
                Back
              </button>
            </>
          )}

          {issue.status === "CLOSED" && (
            <button
              onClick={() => onStatusChange(issue.id, "OPEN")}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-text-secondary hover:text-white disabled:opacity-50 transition-all"
            >
              Reopen
            </button>
          )}

          <button
            onClick={() => onEdit(issue)}
            className="ml-auto rounded-lg p-1.5 text-sf-text-muted hover:bg-sf-base hover:text-white transition-colors"
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(issue.id)}
            className="rounded-lg p-1.5 text-sf-text-muted hover:bg-sf-red/10 hover:text-sf-red transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

      </div>
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
  onQuickCreateOpen: () => void;
  onQuickCreateTitle: (value: string) => void;
  onQuickCreateSubmit: () => void;
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
        "relative flex min-h-[380px] flex-col overflow-hidden rounded-3xl border border-sf-border-default/50 shadow-lg backdrop-blur-sm",
        column.bgColor,
        isOver && "ring-2 ring-sf-accent/40",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-sf-noise opacity-20 mix-blend-overlay" />

      <div className="relative z-10 flex items-center justify-between border-b border-sf-border-subtle/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={cn("h-3 w-3 rounded-full blur-[1px] animate-pulse", column.dotColor)} />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">{column.label}</h3>
          <span className="rounded-lg border border-sf-border-subtle bg-sf-base/80 px-2.5 py-0.5 text-[10px] font-bold text-sf-text-muted">
            {issues.length}
          </span>
        </div>

        <button
          onClick={onQuickCreateOpen}
          className="rounded-lg border border-transparent p-1.5 text-sf-text-muted transition-all hover:border-sf-border-default hover:bg-sf-elevated hover:text-sf-text-primary"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="relative z-10 flex-1 space-y-3 overflow-y-auto p-4">
        {quickCreateOpen && (
          <div className="rounded-xl border border-sf-border-subtle bg-sf-base/60 p-3">
            <input
              value={quickCreateTitle}
              onChange={(e) => onQuickCreateTitle(e.target.value)}
              placeholder={`Quick add to ${column.label}...`}
              className="w-full rounded-lg border border-sf-border-subtle bg-sf-base/70 px-3 py-2 text-sm text-sf-text-primary focus:border-sf-accent focus:outline-none"
              autoFocus
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={onQuickCreateSubmit}
                className="rounded-lg bg-sf-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-sf-accent/90"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {issues.length === 0 && !quickCreateOpen && (
          <button
            onClick={onQuickCreateOpen}
            className="flex w-full items-center justify-center rounded-2xl border border-dashed border-sf-border-default/70 bg-sf-base/30 px-4 py-10 text-sm font-semibold text-sf-text-secondary hover:border-sf-accent/50 hover:text-sf-text-primary"
          >
            + Add issue
          </button>
        )}

        {issues.map((issue) => (
          <DraggableIssueCard
            key={issue.id}
            issue={issue}
            isUpdating={isUpdating}
            onOpen={onOpenIssue}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onEdit={onEdit}
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
        <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-sf-accent-cyan via-sf-purple to-sf-accent-cyan shadow-[0_4px_12px_rgba(0,212,255,0.4)]" />

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
                className="h-10 w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 text-base font-bold text-white placeholder-slate-600 outline-none transition-all focus:border-sf-accent-cyan focus:ring-4 focus:ring-sf-accent-cyan/10"
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
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 p-4 text-sm font-medium text-white placeholder-slate-600 outline-none transition-all focus:border-sf-accent-cyan focus:ring-4 focus:ring-sf-accent-cyan/10"
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
                              t === "FEATURE" ? "bg-cyan-950/40 border-sf-accent-cyan text-sf-accent-cyan shadow-[0_0_20px_rgba(0,212,255,0.15)]" :
                              t === "BUG" ? "bg-red-950/40 border-sf-red text-sf-red shadow-[0_0_20px_rgba(248,113,113,0.15)]" :
                              t === "MARKETING" ? "bg-purple-950/40 border-sf-purple text-sf-purple shadow-[0_0_20px_rgba(192,132,252,0.15)]" :
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
                  className="h-10 w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 text-sm font-black text-white outline-none focus:border-sf-accent-cyan focus:ring-4 focus:ring-sf-accent-cyan/10"
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
                          ? "bg-sf-accent-cyan/10 border-sf-accent-cyan text-sf-accent-cyan shadow-[0_0_10px_rgba(0,212,255,0.1)]"
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
                              ? p === "HIGH" ? "bg-red-950/40 border-sf-red text-sf-red" :
                                p === "MEDIUM" ? "bg-sf-amber/10 border-sf-amber text-sf-amber" :
                                "bg-green-950/40 border-sf-green text-sf-green"
                              : "border-neutral-700 bg-neutral-800 text-slate-500 hover:text-white"
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
                    className="h-10 w-full appearance-none rounded-xl border border-neutral-700 bg-neutral-800 px-4 pr-10 text-sm font-bold text-white outline-none focus:border-sf-accent-cyan focus:ring-4 focus:ring-sf-accent-cyan/10"
                  >
                    <option value="" className="bg-neutral-900">Unassigned</option>
                    <option value={userId || ""} className="bg-neutral-900 font-bold text-sf-accent-cyan italic">Assign to me</option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.user.id} className="bg-neutral-900">
                        {m.user.name || m.user.email}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
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
                  className="h-10 w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 text-sm font-bold text-white outline-none focus:border-sf-accent-cyan focus:ring-4 focus:ring-sf-accent-cyan/10 [color-scheme:dark]"
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
                      className="h-10 w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 text-sm font-bold text-white outline-none focus:border-sf-accent-cyan focus:ring-4 focus:ring-sf-accent-cyan/10"
                      placeholder="e.g. Q1 Release"
                    />
                  </div>
               </CollapsibleContent>
            </Collapsible>
          </div>

          {(error || localError) && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-sf-red/30 bg-sf-red/10 p-2.5 text-xs font-semibold text-sf-red">
              <AlertCircle className="h-3 w-3" />
              {localError || error}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-[2] rounded-xl bg-gradient-to-r from-sf-accent-cyan to-sf-accent via-sf-accent-cyan px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_10px_25px_rgba(0,212,255,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
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
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (timelineIssues.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sf-border p-12 text-center">
        <Calendar className="mx-auto mb-3 h-8 w-8 text-sf-text-muted opacity-30" />
        <p className="text-sm text-sf-text-muted">No scheduled issues yet. Add due dates to see the timeline.</p>
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
    <div className="rounded-2xl border border-sf-border bg-sf-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-xs text-sf-text-muted">
        <span>{minStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <span>{maxEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
      <div className="space-y-3">
        {timelineIssues.map((issue) => {
          const start = new Date(issue.createdAt);
          const end = new Date(issue.dueDate);
          const left = ((start.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
          const width = Math.max(
            2,
            ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1) / totalDays * 100,
          );

          return (
            <div key={issue.id} className="grid grid-cols-[220px_1fr] items-center gap-3">
              <button
                onClick={() => onOpenIssue(issue)}
                className="truncate text-left text-sm font-medium text-sf-text-primary hover:text-sf-accent"
              >
                {issue.title}
              </button>
              <div className="relative h-8 rounded-lg bg-sf-base/50">
                <button
                  onClick={() => onOpenIssue(issue)}
                  className={cn(
                    "absolute top-1 h-6 rounded-md px-2 text-left text-[11px] font-semibold text-white transition-opacity hover:opacity-90",
                    issue.type === "FEATURE" ? "bg-sf-accent-cyan" : "bg-sf-red",
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${new Date(issue.createdAt).toLocaleDateString()} → ${new Date(issue.dueDate).toLocaleDateString()}`}
                >
                  <span className="truncate block">{issue.type === "FEATURE" ? "Feature" : "Bug"}</span>
                </button>
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
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  TYPE_META[issue.type as IssueType]?.color || "text-sf-text-muted",
                  TYPE_META[issue.type as IssueType]?.ring || "ring-sf-border-subtle",
                  "bg-sf-base/40 border",
                  TYPE_META[issue.type as IssueType]?.border || "border-sf-border-subtle"
                )}>
                   {TYPE_META[issue.type as IssueType]?.label || issue.type}
                </span>
                <span className="h-1 w-1 rounded-full bg-sf-border-subtle" />
                <span className="text-[10px] font-bold text-sf-text-muted uppercase tracking-wider">
                  {PRIORITY_META[issue.priority as IssuePriority]?.label || issue.priority} Priority
                </span>
              </div>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-sf-border-subtle bg-sf-base/40 p-4">
                <p className="text-sm leading-relaxed text-sf-text-primary">{issue.description || "No description"}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-sf-border-subtle bg-sf-base/30 p-3">
                  <p className="text-sf-text-muted text-[10px] uppercase font-bold tracking-tight">Status</p>
                  <p className="mt-1 font-bold text-white">{issue.status.replace("_", " ")}</p>
                </div>
                <div className="rounded-lg border border-sf-border-subtle bg-sf-base/30 p-3">
                  <p className="text-sf-text-muted text-[10px] uppercase font-bold tracking-tight">Reward</p>
                  <p className="mt-1 font-bold text-sf-accent-cyan">{issue.points || 0} pts</p>
                </div>
                <div className="rounded-lg border border-sf-border-subtle bg-sf-base/30 p-3">
                  <p className="text-sf-text-muted text-[10px] uppercase font-bold tracking-tight">Due Date</p>
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
                    className="rounded-lg border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-3 py-1.5 text-xs font-semibold text-[#00D4FF]"
                  >
                    Move to In Progress
                  </button>
                )}
                {issue.status !== "CLOSED" && (
                  <button
                    onClick={() => onStatusChange(issue.id, "CLOSED")}
                    disabled={isUpdating}
                    className="rounded-lg border border-sf-green/30 bg-sf-green/10 px-3 py-1.5 text-xs font-semibold text-sf-green"
                  >
                    Move to Done
                  </button>
                )}
                {issue.status === "CLOSED" && (
                  <button
                    onClick={() => onStatusChange(issue.id, "OPEN")}
                    disabled={isUpdating}
                    className="rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3 py-1.5 text-xs font-semibold text-sf-text-secondary"
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => onEdit(issue)}
                  className="rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3 py-1.5 text-xs font-semibold text-sf-text-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(issue.id)}
                  className="rounded-lg border border-sf-red/30 bg-sf-red/10 px-3 py-1.5 text-xs font-semibold text-sf-red"
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
        <Loader2 className="h-6 w-6 animate-spin text-sf-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-3">Board</h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-950 px-3 py-1 text-xs font-bold text-cyan-400 border border-cyan-800 shadow-[0_2px_8px_rgba(34,211,238,0.1)]">
               <Sparkles className="h-3.5 w-3.5" /> {featuresCount} Features
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-red-950 px-3 py-1 text-xs font-bold text-red-400 border border-red-800 shadow-[0_2px_8px_rgba(248,113,113,0.1)]">
               <Bug className="h-3.5 w-3.5" /> {bugsCount} Bugs
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-950 px-3 py-1 text-xs font-bold text-purple-400 border border-purple-800 shadow-[0_2px_8px_rgba(192,132,252,0.1)]">
               <Sparkles className="h-3.5 w-3.5" /> {marketingCount} Marketing
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-green-950 px-3 py-1 text-xs font-bold text-green-400 border border-green-800 shadow-[0_2px_8px_rgba(74,222,128,0.1)]">
               <CheckCircle2 className="h-3.5 w-3.5" /> {closedCount} Shipped
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 rounded-xl bg-sf-elevated/40 p-1 border border-white/5">
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
                  <div className="absolute -bottom-1 left-4 right-4 h-[2px] bg-sf-accent-cyan rounded-full shadow-[0_0_8px_#10b981]" />
                )}
              </button>
            ))}
          </div>
           <div className="flex gap-1.5 rounded-xl border border-white/5 bg-sf-elevated/40 p-1 shadow-lg">
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
                    ? "bg-sf-accent-cyan text-white shadow-[0_4px_12px_rgba(0,212,255,0.2)]"
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
            className="flex items-center gap-1.5 rounded-xl bg-sf-accent px-5 py-2.5 text-sm font-bold tracking-tight text-white shadow-[0_0_15px_rgba(var(--color-sf-accent-rgb),0.3)] hover:bg-sf-accent/90"
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

      {view === "leaderboard" && (
        <LeaderboardView productId={productId} />
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
          className="fixed bottom-6 right-6 z-50 rounded-xl border border-sf-accent-cyan/40 bg-sf-accent-cyan/15 px-4 py-2 text-sm font-semibold text-sf-accent-cyan shadow-xl"
        >
          {toast}
        </button>
      )}
    </div>
  );
}
