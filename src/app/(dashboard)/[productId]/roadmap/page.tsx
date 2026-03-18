"use client";

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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/provider";

type IssueType = "FEATURE" | "BUG";
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

const PRIORITY_META: Record<IssuePriority, { label: string; bar: string }> = {
  P0: { label: "P0", bar: "bg-sf-red" },
  P1: { label: "P1", bar: "bg-sf-amber" },
  P2: { label: "P2", bar: "bg-sf-accent-emerald" },
  HIGH: { label: "High", bar: "bg-sf-red" },
  MEDIUM: { label: "Med", bar: "bg-sf-amber" },
  LOW: { label: "Low", bar: "bg-sf-text-muted" },
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

  const priority = PRIORITY_META[issue.priority as IssuePriority] ?? PRIORITY_META.MEDIUM;
  const isClosed = issue.status === "CLOSED";
  const leftBarClass = isClosed ? "bg-sf-text-muted" : priority.bar;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(issue)}
      className={cn(
        "group relative rounded-xl border border-sf-border-subtle bg-sf-elevated/80 p-4 shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-2xl cursor-pointer",
        isDragging && "opacity-60",
      )}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl", leftBarClass)} />
      <div style={{ opacity: isClosed ? 0.55 : 1 }}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                issue.type === "FEATURE"
                  ? "border-sf-purple/30 bg-sf-purple/10 text-sf-purple"
                  : "border-sf-red/30 bg-sf-red/10 text-sf-red",
              )}
            >
              {issue.type === "FEATURE" ? <Sparkles className="h-2.5 w-2.5" /> : <Bug className="h-2.5 w-2.5" />}
              {issue.type === "FEATURE" ? "Feature" : "Bug"}
            </span>
            <span className="rounded-full bg-sf-base px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sf-text-secondary border border-sf-border-subtle">
              {priority.label}
            </span>
          </div>
          <button
            onClick={(e) => e.stopPropagation()}
            className="rounded-md p-1 text-sf-text-muted hover:text-sf-text-primary cursor-grab active:cursor-grabbing"
            {...(draggable ? listeners : {})}
            {...(draggable ? attributes : {})}
            aria-label="Drag issue"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className={cn("text-[13px] font-semibold leading-snug text-sf-text-primary", isClosed && "line-through")}>{issue.title}</p>

        {issue.description && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-sf-text-muted">{issue.description}</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          {issue.milestone && (
            <span className="inline-flex items-center gap-1 text-[10px] text-sf-text-muted">
              <Tag className="h-2.5 w-2.5" />
              {issue.milestone}
            </span>
          )}
          {issue.dueDate && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sf-text-secondary">
              <Calendar className="h-2.5 w-2.5" />
              Due {new Date(issue.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {issue.costs && issue.costs.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-sf-green/10 px-1.5 py-0.5 text-[10px] font-bold text-sf-green">
              <DollarSign className="h-2.5 w-2.5" />
              {formatMoney(issue.costs.reduce((s: number, c: any) => s + c.amount, 0))}
            </span>
          )}
          {issue.assignee && (
            <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border border-sf-accent/20 bg-sf-accent/10 text-[8px] font-bold text-sf-accent">
              {(issue.assignee.name || issue.assignee.email).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="relative z-10 mt-4 flex items-center gap-1.5 border-t border-sf-border-subtle/60 pt-3" onClick={(e) => e.stopPropagation()}>
          {issue.status === "OPEN" && (
            <button
              onClick={() => onStatusChange(issue.id, "IN_PROGRESS")}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 rounded-lg border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#00D4FF] hover:bg-[#00D4FF]/20 disabled:opacity-50"
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
                className="inline-flex items-center gap-1 rounded-lg border border-sf-green/30 bg-sf-green/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-green hover:bg-sf-green/20 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3 w-3" />
                Done
              </button>
              <button
                onClick={() => onStatusChange(issue.id, "OPEN")}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-text-secondary hover:text-sf-text-primary disabled:opacity-50"
              >
                Back
              </button>
            </>
          )}

          {issue.status === "CLOSED" && (
            <button
              onClick={() => onStatusChange(issue.id, "OPEN")}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-text-secondary hover:text-sf-text-primary disabled:opacity-50"
            >
              Reopen
            </button>
          )}

          <button
            onClick={() => onEdit(issue)}
            className="ml-auto rounded-lg p-1.5 text-sf-text-muted hover:bg-sf-base hover:text-sf-text-primary"
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(issue.id)}
            className="rounded-lg p-1.5 text-sf-text-muted hover:bg-sf-red/10 hover:text-sf-red"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
        <div className="flex items-center gap-2.5">
          <span className={cn("h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]", column.dotColor)} />
          <h3 className="text-sm font-bold uppercase tracking-wide text-sf-text-primary">{column.label}</h3>
          <span className="rounded-full border border-sf-border-subtle bg-sf-base/80 px-2.5 py-0.5 text-[10px] font-bold text-sf-text-secondary">
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
}: {
  mode: "create" | "edit";
  issue?: any;
  members: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  error?: string;
}) {
  const [localError, setLocalError] = useState<string>("");
  const [form, setForm] = useState<IssueForm>({
    title: issue?.title || "",
    description: issue?.description || "",
    type: (issue?.type || "FEATURE") as IssueType,
    priority: (issue?.priority || "MEDIUM") as IssuePriority,
    dueDate: issue?.dueDate ? new Date(issue.dueDate).toISOString().split("T")[0] : "",
    milestone: issue?.milestone || "",
    assigneeId: issue?.assigneeId || "",
  });

  const submit = () => {
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-sf-border-subtle bg-sf-elevated p-8 shadow-2xl"
      >
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-sf-purple to-sf-accent" />
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight text-sf-text-primary">{mode === "create" ? "Create Issue" : "Edit Issue"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-transparent p-1.5 text-sf-text-muted transition-colors hover:border-sf-border-subtle hover:bg-sf-base hover:text-sf-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent focus:outline-none"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full resize-none rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent focus:outline-none"
              placeholder="Add details..."
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary">Assignee</label>
            <select
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              className="w-full appearance-none rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm text-sf-text-primary focus:border-sf-accent focus:outline-none"
            >
              <option value="">Unassigned</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.user.id}>
                  {m.user.name || m.user.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["FEATURE", "BUG"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl py-3 text-[11px] font-bold uppercase tracking-wider transition-all",
                      form.type === t
                        ? t === "FEATURE"
                          ? "border border-sf-purple/50 bg-sf-purple/10 text-sf-purple"
                          : "border border-sf-red/50 bg-sf-red/10 text-sf-red"
                        : "border border-sf-border-subtle bg-sf-base/50 text-sf-text-secondary hover:text-sf-text-primary",
                    )}
                  >
                    {t === "FEATURE" ? <Sparkles className="h-3 w-3" /> : <Bug className="h-3 w-3" />}
                    {t === "FEATURE" ? "Feature" : "Bug"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as IssuePriority })}
                className="w-full appearance-none rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm font-semibold text-sf-text-primary focus:border-sf-accent focus:outline-none"
              >
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm text-sf-text-primary focus:border-sf-accent focus:outline-none [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary">Milestone</label>
              <input
                value={form.milestone}
                onChange={(e) => setForm({ ...form, milestone: e.target.value })}
                className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent focus:outline-none"
                placeholder="v1.0, Sprint 3..."
              />
            </div>
          </div>
        </div>

        {(error || localError) && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-sf-red/30 bg-sf-red/10 p-3 text-xs font-semibold text-sf-red">
            <AlertCircle className="h-3.5 w-3.5" />
            {localError || error}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm font-semibold text-sf-text-secondary hover:bg-sf-border-subtle hover:text-sf-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-sf-accent px-4 py-3 text-sm font-bold tracking-tight text-white hover:bg-sf-accent/90 disabled:opacity-50"
          >
            {isPending ? "Saving..." : mode === "create" ? "Create Issue" : "Save Changes"}
          </button>
        </div>
      </form>
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
              <SheetTitle>{issue.title}</SheetTitle>
              <SheetDescription>
                {issue.type === "FEATURE" ? "Feature" : "Bug"} · {issue.priority}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-sf-border-subtle bg-sf-base/40 p-4">
                <p className="text-sm leading-relaxed text-sf-text-primary">{issue.description || "No description"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-sf-border-subtle bg-sf-base/30 p-3">
                  <p className="text-sf-text-muted">Status</p>
                  <p className="mt-1 font-semibold text-sf-text-primary">{issue.status.replace("_", " ")}</p>
                </div>
                <div className="rounded-lg border border-sf-border-subtle bg-sf-base/30 p-3">
                  <p className="text-sf-text-muted">Due Date</p>
                  <p className="mt-1 font-semibold text-sf-text-primary">
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
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.productId as string;

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "features" | "bugs">("all");
  const [view, setView] = useState<"board" | "timeline">("board");
  const [quickColumn, setQuickColumn] = useState<IssueStatus | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  useEffect(() => {
    const queryFilter = searchParams.get("filter");
    if (queryFilter === "all" || queryFilter === "features" || queryFilter === "bugs") {
      setFilter(queryFilter);
    }
  }, [searchParams]);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const utils = trpc.useUtils();
  const { data: issues, isLoading } = trpc.issue.list.useQuery({ productId });
  const { data: members } = trpc.product.listMembers.useQuery({ productId });

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
    return true;
  });

  const activeIssue = useMemo(
    () => allIssues.find((issue: any) => issue.id === activeIssueId) || null,
    [allIssues, activeIssueId],
  );

  const featuresCount = allIssues.filter((i: any) => i.type === "FEATURE" && i.status !== "CLOSED").length;
  const bugsCount = allIssues.filter((i: any) => i.type === "BUG" && i.status !== "CLOSED").length;
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
          <h1 className="text-2xl font-bold tracking-tight text-sf-text-primary">Issues</h1>
          <p className="mt-1 text-sm font-medium text-sf-text-secondary">
            {featuresCount} features · {bugsCount} bugs open · {closedCount} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-sf-border-subtle bg-sf-surface p-1 shadow-md">
            <button
              onClick={() => setView("board")}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                view === "board"
                  ? "border border-sf-border-subtle bg-sf-base text-sf-text-primary"
                  : "text-sf-text-secondary hover:text-sf-text-primary",
              )}
            >
              Board
            </button>
            <button
              onClick={() => setView("timeline")}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                view === "timeline"
                  ? "border border-sf-border-subtle bg-sf-base text-sf-text-primary"
                  : "text-sf-text-secondary hover:text-sf-text-primary",
              )}
            >
              Timeline
            </button>
          </div>

          <div className="flex gap-1.5 rounded-xl border border-sf-border-subtle bg-sf-surface p-1 shadow-md">
            {[
              { key: "all" as const, label: "All" },
              { key: "features" as const, label: "Features", count: featuresCount },
              { key: "bugs" as const, label: "Bugs", count: bugsCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-lg border border-transparent px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                  filter === key
                    ? "border-sf-accent/30 bg-sf-accent/10 text-sf-accent"
                    : "text-sf-text-secondary hover:border-sf-border-default hover:bg-sf-base hover:text-sf-text-primary",
                )}
              >
                {label}
                {count !== undefined && (
                  <span className={cn("ml-1.5 rounded px-1.5 py-0.5 font-mono text-[10px]", filter === key ? "bg-sf-accent/20" : "bg-sf-base text-sf-text-muted")}>{count}</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setModalMode("create")}
            className="flex items-center gap-1.5 rounded-xl bg-sf-accent px-5 py-2.5 text-sm font-bold tracking-tight text-white shadow-[0_0_15px_rgba(var(--color-sf-accent-rgb),0.3)] hover:bg-sf-accent/90"
          >
            <Plus className="h-4 w-4" />
            New Issue
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
