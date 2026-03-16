"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus, Loader2, AlertCircle, X, Trash2, Bug, Sparkles, DollarSign,
  ChevronRight, GripVertical, Calendar, Tag, Edit3, CheckCircle2
} from "lucide-react";
import { trpc } from "@/lib/trpc/provider";

type IssueType = "FEATURE" | "BUG";
type IssuePriority = "P0" | "P1" | "P2" | "HIGH" | "MEDIUM" | "LOW";
type IssueStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
 
function formatMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

const COLUMNS: { key: IssueStatus; label: string; color: string; dotColor: string; bgColor: string }[] = [
  { key: "OPEN", label: "To Do", color: "text-sf-text-primary", dotColor: "bg-sf-text-muted", bgColor: "bg-[#0D1117]/50" },
  { key: "IN_PROGRESS", label: "In Progress", color: "text-sf-text-primary", dotColor: "bg-[#00D4FF]", bgColor: "bg-[#00D4FF]/5" },
  { key: "CLOSED", label: "Done", color: "text-sf-text-primary", dotColor: "bg-sf-green", bgColor: "bg-sf-green/5" },
];

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; color: string; bg: string }> = {
  P0: { label: "P0 Critical", color: "text-sf-red", bg: "bg-sf-red/10 border border-sf-red/20 shadow-[0_0_8px_rgba(239,68,68,0.3)]" },
  P1: { label: "P1 High", color: "text-sf-orange", bg: "bg-sf-orange/10 border border-sf-orange/20" },
  P2: { label: "P2 Medium", color: "text-sf-amber", bg: "bg-sf-amber/10 border border-sf-amber/20" },
  HIGH: { label: "High", color: "text-sf-red", bg: "bg-sf-red/10 border border-sf-red/20" },
  MEDIUM: { label: "Medium", color: "text-sf-amber", bg: "bg-sf-amber/10 border border-sf-amber/20" },
  LOW: { label: "Low", color: "text-sf-text-secondary", bg: "bg-sf-base border border-sf-border-subtle" },
};

/* ─── Issue Card ─── */
function IssueCard({
  issue,
  onStatusChange,
  onDelete,
  onEdit,
  isUpdating,
}: {
  issue: any;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (issue: any) => void;
  isUpdating: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const p = PRIORITY_CONFIG[issue.priority as IssuePriority] ?? PRIORITY_CONFIG.MEDIUM;
  const isFeature = issue.type === "FEATURE";
  const isClosed = issue.status === "CLOSED";

  return (
    <div
      className={`group relative rounded-xl border bg-sf-elevated/80 p-4 shadow-xl backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-2xl ${
        isClosed ? "border-sf-border-subtle/50 opacity-60 grayscale-[50%]" : "border-sf-border-subtle hover:border-sf-border-default"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[rgba(255,255,255,0.03)] to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none"></div>
      
      {/* Top row: type badge + actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isFeature ? "border-sf-purple/30 bg-sf-purple/10 text-sf-purple" : "border-sf-red/30 bg-sf-red/10 text-sf-red"
          }`}>
            {isFeature ? <Sparkles className="h-2.5 w-2.5" /> : <Bug className="h-2.5 w-2.5" />}
            {isFeature ? "Feature" : "Bug"}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${p.bg} ${p.color}`}>{p.label}</span>
        </div>

        {showActions && !isClosed && (
          <div className="flex items-center gap-0.5 relative z-10">
            <button
              onClick={() => onEdit(issue)}
              className="rounded-lg p-1.5 text-sf-text-muted hover:bg-sf-base hover:text-sf-text-primary transition-colors"
              title="Edit"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(issue.id)}
              className="rounded-lg p-1.5 text-sf-text-muted hover:bg-sf-red/10 hover:text-sf-red transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <p className={`text-[13px] font-semibold tracking-tight leading-snug relative z-10 ${isClosed ? "text-sf-text-secondary line-through" : "text-sf-text-primary"}`}>
        {issue.title}
      </p>

      {/* Description preview */}
      {issue.description && (
        <p className="mt-1 text-[11px] text-sf-text-muted line-clamp-2 leading-relaxed">{issue.description}</p>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
        {issue.milestone && (
          <span className="flex items-center gap-1 text-[10px] text-sf-text-muted">
            <Tag className="h-2.5 w-2.5" />
            {issue.milestone}
          </span>
        )}
        {issue.dueDate && (
          <span className="flex items-center gap-1 text-[10px] text-sf-text-muted">
            <Calendar className="h-2.5 w-2.5" />
            {new Date(issue.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
        {issue.costs && issue.costs.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-sf-green bg-sf-green/10 px-1.5 py-0.5 rounded">
            <DollarSign className="h-2.5 w-2.5" />
            {formatMoney(issue.costs.reduce((s: number, c: any) => s + c.amount, 0))}
          </span>
        )}
        {issue.assignee && (
          <div className="flex items-center gap-1 ml-auto">
            <div 
              className="h-5 w-5 rounded-full bg-sf-accent/10 border border-sf-accent/20 flex items-center justify-center text-[8px] font-bold text-sf-accent"
              title={`Assigned to ${issue.assignee.name || issue.assignee.email}`}
            >
              {(issue.assignee.name || issue.assignee.email).charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Status change buttons */}
      {!isClosed && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-sf-border-subtle/50 relative z-10">
          {issue.status === "OPEN" && (
            <button
              onClick={() => onStatusChange(issue.id, "IN_PROGRESS")}
              disabled={isUpdating}
              className="flex items-center gap-1 rounded-lg border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#00D4FF] hover:bg-[#00D4FF]/20 transition-all disabled:opacity-50"
            >
              <ChevronRight className="h-3 w-3" /> Start Progress
            </button>
          )}
          {issue.status === "IN_PROGRESS" && (
            <>
              <button
                onClick={() => onStatusChange(issue.id, "CLOSED")}
                disabled={isUpdating}
                className="flex items-center gap-1 rounded-lg border border-sf-green/30 bg-sf-green/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-green hover:bg-sf-green/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-3 w-3" /> Done
              </button>
              <button
                onClick={() => onStatusChange(issue.id, "OPEN")}
                disabled={isUpdating}
                className="flex items-center gap-1 rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-text-secondary hover:text-sf-text-primary hover:bg-sf-border-subtle transition-all disabled:opacity-50"
              >
                Move Back
              </button>
            </>
          )}
        </div>
      )}

      {/* Reopen for closed */}
      {isClosed && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-sf-border-subtle/30 relative z-10">
          <button
            onClick={() => onStatusChange(issue.id, "OPEN")}
            disabled={isUpdating}
            className="flex items-center gap-1 rounded-lg border border-sf-border-subtle bg-sf-base/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sf-text-secondary hover:text-sf-text-primary hover:bg-sf-border-subtle transition-all disabled:opacity-50"
          >
            Reopen
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Kanban Column ─── */
function KanbanColumn({
  column,
  issues,
  onStatusChange,
  onDelete,
  onEdit,
  isUpdating,
  onAddClick,
}: {
  column: (typeof COLUMNS)[number];
  issues: any[];
  onStatusChange: (id: string, status: IssueStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (issue: any) => void;
  isUpdating: boolean;
  onAddClick?: () => void;
}) {
  return (
    <div className={`flex flex-col rounded-3xl ${column.bgColor} border border-sf-border-default/50 min-h-[500px] shadow-lg backdrop-blur-sm relative overflow-hidden`}>
      {/* Column background noise optional */}
      <div className="absolute inset-0 bg-sf-noise opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* Column header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-sf-border-subtle/50 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${column.dotColor} shadow-[0_0_8px_currentColor]`} />
          <h3 className={`text-sm font-bold tracking-wide uppercase ${column.color}`}>{column.label}</h3>
          <span className="rounded-full border border-sf-border-subtle bg-sf-base/80 px-2.5 py-0.5 text-[10px] font-bold text-sf-text-secondary shadow-sm">
            {issues.length}
          </span>
        </div>
        {column.key === "OPEN" && onAddClick && (
          <button
            onClick={onAddClick}
            className="rounded-lg p-1.5 text-sf-text-muted hover:bg-sf-elevated hover:text-sf-text-primary transition-all border border-transparent hover:border-sf-border-default"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto relative z-10">
        {issues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-sf-text-muted/50">
            <GripVertical className="h-8 w-8 mb-3 opacity-30" />
            <p className="text-xs font-semibold uppercase tracking-widest">No items</p>
          </div>
        )}
        {issues.map((issue: any) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onEdit={onEdit}
            isUpdating={isUpdating}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Create / Edit Modal ─── */
interface IssueForm {
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  dueDate: string;
  milestone: string;
  assigneeId: string;
}

/* ─── Create / Edit Modal ─── */
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
  const [form, setForm] = useState<IssueForm>({
    title: issue?.title || "",
    description: issue?.description || "",
    type: (issue?.type || "FEATURE") as IssueType,
    priority: (issue?.priority || "MEDIUM") as IssuePriority,
    dueDate: issue?.dueDate ? new Date(issue.dueDate).toISOString().split("T")[0] : "",
    milestone: issue?.milestone || "",
    assigneeId: issue?.assigneeId || "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080B12]/80 backdrop-blur-md p-4 transition-all overflow-y-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="w-full max-w-lg rounded-2xl border border-sf-border-subtle bg-sf-elevated p-8 shadow-2xl relative overflow-hidden my-auto"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sf-purple to-sf-accent"></div>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold tracking-tight text-sf-text-primary">
            {mode === "create" ? "Create Issue" : "Edit Issue"}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-sf-text-muted hover:bg-sf-base hover:text-sf-text-primary transition-colors border border-transparent hover:border-sf-border-subtle">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {/* Title */}
            <div className="col-span-2">
              <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary mb-2">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all"
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all resize-none"
              placeholder="Add details..."
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary mb-2">Assignee</label>
            <select
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all appearance-none"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.user.id}>
                  {m.user.name || m.user.email} {m.user.id === issue?.reporterId ? "(Reporter)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["FEATURE", "BUG"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-[11px] font-bold uppercase tracking-wider transition-all ${
                      form.type === t
                        ? t === "FEATURE"
                          ? "border border-sf-purple/50 bg-sf-purple/10 text-sf-purple shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                          : "border border-sf-red/50 bg-sf-red/10 text-sf-red shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        : "border border-sf-border-subtle bg-sf-base/50 text-sf-text-secondary hover:text-sf-text-primary hover:border-sf-border-default hover:bg-sf-surface"
                    }`}
                  >
                    {t === "FEATURE" ? <Sparkles className="h-3 w-3" /> : <Bug className="h-3 w-3" />}
                    {t === "FEATURE" ? "Feature" : "Bug"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary mb-2">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as IssuePriority })}
                className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm font-semibold text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all appearance-none"
              >
                <option value="P0" className="bg-sf-elevated text-sf-red font-bold">🔴 P0 — Critical</option>
                <option value="P1" className="bg-sf-elevated text-sf-orange">🟠 P1 — High</option>
                <option value="P2" className="bg-sf-elevated text-sf-amber">🟡 P2 — Medium</option>
                <option value="HIGH" className="bg-sf-elevated text-sf-red">High</option>
                <option value="MEDIUM" className="bg-sf-elevated text-sf-amber">Medium</option>
                <option value="LOW" className="bg-sf-elevated text-sf-text-secondary">Low</option>
              </select>
            </div>
          </div>

          {/* Due date + Milestone */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary mb-2">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm text-sf-text-primary focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-sf-text-secondary mb-2">Milestone / Sprint</label>
              <input
                value={form.milestone}
                onChange={(e) => setForm({ ...form, milestone: e.target.value })}
                className="w-full rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm text-sf-text-primary placeholder:text-sf-text-muted focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30 focus:outline-none transition-all"
                placeholder="v1.0, Sprint 3..."
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-sf-red/30 bg-sf-red/10 p-3 text-xs font-semibold text-sf-red">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-sf-border-subtle bg-sf-base/50 px-4 py-3 text-sm font-semibold text-sf-text-secondary hover:text-sf-text-primary hover:bg-sf-border-subtle transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-sf-accent px-4 py-3 text-sm font-bold tracking-tight text-white hover:bg-sf-accent/90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(var(--color-sf-accent-rgb),0.3)]"
          >
            {isPending ? "Saving..." : mode === "create" ? "Create Issue" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
/* ─── Cycle Timeline ─── */
function CycleTimeline({ issues }: { issues: any[] }) {
  // Group issues by month/year based on createdAt, closedAt, or status change
  const months: Record<string, { created: any[]; closed: any[]; active: any[] }> = {};

  for (const issue of issues) {
    const createdDate = new Date(issue.createdAt);
    const createdKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, "0")}`;
    if (!months[createdKey]) months[createdKey] = { created: [], closed: [], active: [] };
    months[createdKey].created.push(issue);

    if (issue.closedAt) {
      const closedDate = new Date(issue.closedAt);
      const closedKey = `${closedDate.getFullYear()}-${String(closedDate.getMonth() + 1).padStart(2, "0")}`;
      if (!months[closedKey]) months[closedKey] = { created: [], closed: [], active: [] };
      months[closedKey].closed.push(issue);
    }

    if (issue.status === "IN_PROGRESS") {
      // Show in current month
      const now = new Date();
      const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      if (!months[nowKey]) months[nowKey] = { created: [], closed: [], active: [] };
      months[nowKey].active.push(issue);
    }
  }

  const sortedKeys = Object.keys(months).sort((a, b) => b.localeCompare(a));

  if (sortedKeys.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sf-border p-12 text-center">
        <Calendar className="h-8 w-8 text-sf-text-muted mx-auto mb-3 opacity-30" />
        <p className="text-sm text-sf-text-muted">No activity yet. Create issues to see your timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedKeys.map((key) => {
        const [year, month] = key.split("-");
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const data = months[key];

        return (
          <div key={key} className="rounded-2xl border border-sf-border bg-white overflow-hidden shadow-sm">
            {/* Month header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-sf-border/50">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-sf-accent" />
                <h3 className="text-sm font-bold text-sf-text">{monthName}</h3>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-medium">
                {data.created.length > 0 && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    {data.created.length} created
                  </span>
                )}
                {data.active.length > 0 && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {data.active.length} in progress
                  </span>
                )}
                {data.closed.length > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {data.closed.length} completed
                  </span>
                )}
              </div>
            </div>

            {/* Issues in this month */}
            <div className="divide-y divide-sf-border/30">
              {/* Active items */}
              {data.active.map((issue: any) => (
                <div key={`active-${issue.id}`} className="flex items-center gap-3 px-5 py-2.5 bg-blue-50/30">
                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    issue.type === "FEATURE" ? "bg-violet-100 text-violet-700" : "bg-red-100 text-red-700"
                  }`}>
                    {issue.type === "FEATURE" ? <Sparkles className="h-2 w-2" /> : <Bug className="h-2 w-2" />}
                    {issue.type === "FEATURE" ? "Feature" : "Bug"}
                  </span>
                  <span className="text-xs font-medium text-sf-text flex-1">{issue.title}</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-600">In Progress</span>
                </div>
              ))}
              {/* Closed items */}
              {data.closed.map((issue: any) => (
                <div key={`closed-${issue.id}`} className="flex items-center gap-3 px-5 py-2.5 bg-emerald-50/20">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    issue.type === "FEATURE" ? "bg-violet-100 text-violet-700" : "bg-red-100 text-red-700"
                  }`}>
                    {issue.type === "FEATURE" ? <Sparkles className="h-2 w-2" /> : <Bug className="h-2 w-2" />}
                    {issue.type === "FEATURE" ? "Feature" : "Bug"}
                  </span>
                  <span className="text-xs font-medium text-sf-text flex-1 line-through opacity-70">{issue.title}</span>
                  <span className="text-[10px] text-sf-text-muted">
                    {issue.closedAt && new Date(issue.closedAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
              {/* Created items (only show those not already in active/closed) */}
              {data.created
                .filter((issue: any) => 
                  !data.active.find((a: any) => a.id === issue.id) && 
                  !data.closed.find((c: any) => c.id === issue.id)
                )
                .map((issue: any) => (
                  <div key={`created-${issue.id}`} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
                    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                      issue.type === "FEATURE" ? "bg-violet-100 text-violet-700" : "bg-red-100 text-red-700"
                    }`}>
                      {issue.type === "FEATURE" ? <Sparkles className="h-2 w-2" /> : <Bug className="h-2 w-2" />}
                      {issue.type === "FEATURE" ? "Feature" : "Bug"}
                    </span>
                    <span className="text-xs font-medium text-sf-text flex-1">{issue.title}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">To Do</span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page ─── */
export default function RoadmapPage() {
  const params = useParams();
  const productId = params.productId as string;
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "features" | "bugs">("all");
  const [view, setView] = useState<"board" | "timeline">("board");

  const utils = trpc.useUtils();
  const { data: issues, isLoading } = trpc.issue.list.useQuery({ productId });
  const { data: members } = trpc.product.listMembers.useQuery({ productId });

  const createIssue = trpc.issue.create.useMutation({
    onSuccess: () => {
      utils.issue.list.invalidate({ productId });
      setModalMode(null);
    },
  });

  const updateIssue = trpc.issue.update.useMutation({
    onSuccess: () => {
      utils.issue.list.invalidate({ productId });
      setModalMode(null);
      setEditingIssue(null);
    },
  });

  const updateStatus = trpc.issue.updateStatus.useMutation({
    onSuccess: () => utils.issue.list.invalidate({ productId }),
  });

  const deleteIssue = trpc.issue.delete.useMutation({
    onSuccess: () => utils.issue.list.invalidate({ productId }),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sf-text-muted" />
      </div>
    );
  }

  const allIssues = issues ?? [];
  const filteredIssues = allIssues.filter((i: any) => {
    if (filter === "features") return i.type === "FEATURE";
    if (filter === "bugs") return i.type === "BUG";
    return true;
  });

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
  }

  function handleModalSubmit(data: any) {
    if (modalMode === "create") {
      createIssue.mutate({ productId, ...data });
    } else if (modalMode === "edit" && editingIssue) {
      updateIssue.mutate({ id: editingIssue.id, ...data });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sf-text-primary">Issues</h1>
          <p className="text-sm font-medium text-sf-text-secondary mt-1">
            {featuresCount} features · {bugsCount} bugs open · {closedCount} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 rounded-xl bg-sf-surface border border-sf-border-subtle p-1 shadow-md">
            <button
              onClick={() => setView("board")}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                view === "board" ? "bg-sf-base shadow-inner text-sf-text-primary border border-sf-border-subtle" : "text-sf-text-secondary hover:text-sf-text-primary"
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setView("timeline")}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                view === "timeline" ? "bg-sf-base shadow-inner text-sf-text-primary border border-sf-border-subtle" : "text-sf-text-secondary hover:text-sf-text-primary"
              }`}
            >
              Timeline
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 rounded-xl bg-sf-surface border border-sf-border-subtle p-1 shadow-md">
            {[
              { key: "all" as const, label: "All" },
              { key: "features" as const, label: "Features", count: featuresCount },
              { key: "bugs" as const, label: "Bugs", count: bugsCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border border-transparent ${
                  filter === key
                    ? "bg-sf-accent/10 text-sf-accent border-sf-accent/30 shadow-[0_0_10px_rgba(var(--color-sf-accent-rgb),0.2)]"
                    : "text-sf-text-secondary hover:text-sf-text-primary hover:bg-sf-base hover:border-sf-border-default"
                }`}
              >
                {label}
                {count !== undefined && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded font-mono text-[10px] ${filter === key ? "bg-sf-accent/20 text-sf-accent" : "bg-sf-base text-sf-text-muted"}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setModalMode("create")}
            className="flex items-center gap-1.5 rounded-xl bg-sf-accent px-5 py-2.5 text-sm font-bold tracking-tight text-white shadow-[0_0_15px_rgba(var(--color-sf-accent-rgb),0.3)] hover:bg-sf-accent/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Issue
          </button>
        </div>
      </div>

      {/* Board View */}
      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((column) => {
            const columnIssues = filteredIssues
              .filter((i: any) => i.status === column.key)
              .sort((a: any, b: any) => {
                const priorityOrder = ["P0", "HIGH", "P1", "MEDIUM", "P2", "LOW"];
                const aIdx = priorityOrder.indexOf(a.priority);
                const bIdx = priorityOrder.indexOf(b.priority);
                if (aIdx !== bIdx) return aIdx - bIdx;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              });

            return (
              <KanbanColumn
                key={column.key}
                column={column}
                issues={columnIssues}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onEdit={handleEdit}
                isUpdating={updateStatus.isPending}
                onAddClick={column.key === "OPEN" ? () => setModalMode("create") : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Timeline View */}
      {view === "timeline" && <CycleTimeline issues={filteredIssues} />}

      {/* Modal */}
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
    </div>
  );
}
