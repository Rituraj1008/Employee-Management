"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Loader2, CheckCircle2, Circle, Trash2, Plus,
  Clock, User, MessageSquarePlus, Save,
} from "lucide-react";
import {
  getWeekDates, formatWeekRange, formatDayLabel, toLocalDateString,
} from "@/lib/utils/weeks";

/* ── Types ── */

interface ChecklistItem {
  id: string; text: string; isCompleted: boolean; completedAt: string | null;
}
interface DailyTask {
  id: string; title: string; description: string | null; date: string;
  status: string; notes: string | null; checklistItems: ChecklistItem[];
}
interface WeeklyTaskData {
  id: string; title: string; description: string | null; status: string;
  progress: number; weekNumber: number; createdAt: string; managerRemark: string | null;
  project: {
    id: string; name: string; createdAt: string;
    deadline: string | null; managerName: string | null;
  };
  assignedTo: { id: string; name: string; designation: string | null; profileImage: string | null };
  dailyTasks: DailyTask[];
}

/* ── Helpers ── */

function ProgressRing({ value }: { value: number }) {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, value) / 100) * circ;
  return (
    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
      <circle
        cx="36" cy="36" r={r} fill="none" strokeWidth="6"
        stroke="oklch(0.56 0.19 47)" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
}

function Avatar({ name, image }: { name: string; image?: string | null }) {
  if (image) return <img src={image} alt={name} className="h-7 w-7 rounded-full object-cover" />;
  return (
    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Day status options ── */
const DAY_STATUS = [
  { value: "TODO",        label: "Not Done",  short: "✗", cls: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",         active: "bg-zinc-100 text-zinc-700 font-bold dark:bg-zinc-800 dark:text-zinc-200" },
  { value: "IN_PROGRESS", label: "Preparing", short: "↺", cls: "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30",       active: "bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/40 dark:text-blue-300" },
  { value: "COMPLETED",   label: "Done",      short: "✓", cls: "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30", active: "bg-emerald-50 text-emerald-700 font-bold dark:bg-emerald-950/40 dark:text-emerald-300" },
] as const;

/* ── Day Card ── */

function DayCard({
  date, dailyTask, canEdit, projectId, weeklyTaskId, onRefresh,
}: {
  date: Date;
  dailyTask: DailyTask | null;
  canEdit: boolean;
  projectId: string;
  weeklyTaskId: string;
  onRefresh: () => void;
}) {
  const [planOpen, setPlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ title: "", description: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [togglingItem, setTogglingItem] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  const dateStr = toLocalDateString(date);
  const isToday = toLocalDateString(new Date()) === dateStr;

  async function changeDayStatus(newStatus: string) {
    if (!canEdit) return;
    setChangingStatus(true);
    try {
      if (dailyTask) {
        // Patch existing daily task status
        await fetch(
          `/api/projects/${projectId}/weekly-tasks/${weeklyTaskId}/daily-tasks/${dailyTask.id}`,
          { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) },
        );
      } else {
        // Auto-create with this status — no plan dialog needed
        await fetch(
          `/api/projects/${projectId}/weekly-tasks/${weeklyTaskId}/daily-tasks`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Day's plan", date: dateStr, status: newStatus }),
          },
        );
      }
      onRefresh();
    } finally { setChangingStatus(false); }
  }

  async function savePlan() {
    if (!planForm.title.trim()) { toast.error("Write what you plan to do"); return; }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/weekly-tasks/${weeklyTaskId}/daily-tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: planForm.title,
            description: planForm.description || undefined,
            date: dateStr,
            notes: planForm.notes || undefined,
          }),
        },
      );
      if (!res.ok) { toast.error("Failed to save plan"); return; }
      setPlanOpen(false);
      setPlanForm({ title: "", description: "", notes: "" });
      onRefresh();
    } finally { setSaving(false); }
  }

  async function addItem() {
    if (!newItem.trim() || !dailyTask) return;
    setAddingItem(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/weekly-tasks/${weeklyTaskId}/daily-tasks/${dailyTask.id}/checklist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newItem }),
        },
      );
      if (!res.ok) { toast.error("Failed to add item"); return; }
      setNewItem("");
      onRefresh();
    } finally { setAddingItem(false); }
  }

  async function toggle(itemId: string) {
    if (!dailyTask) return;
    setTogglingItem(itemId);
    try {
      await fetch(
        `/api/projects/${projectId}/weekly-tasks/${weeklyTaskId}/daily-tasks/${dailyTask.id}/checklist/${itemId}`,
        { method: "PATCH" },
      );
      onRefresh();
    } finally { setTogglingItem(null); }
  }

  async function deleteItem(itemId: string) {
    if (!dailyTask) return;
    await fetch(
      `/api/projects/${projectId}/weekly-tasks/${weeklyTaskId}/daily-tasks/${dailyTask.id}/checklist/${itemId}`,
      { method: "DELETE" },
    );
    onRefresh();
  }

  const done  = dailyTask?.checklistItems.filter((c) => c.isCompleted).length ?? 0;
  const total = dailyTask?.checklistItems.length ?? 0;
  const currentStatus = dailyTask?.status ?? "TODO";

  return (
    <>
      <div className={`rounded-xl border bg-card flex flex-col transition-all ${
        isToday ? "border-primary/50 shadow-sm shadow-primary/10" : "border-border"
      } ${currentStatus === "COMPLETED" ? "border-emerald-400/60 dark:border-emerald-600/40" : ""}`}>

        {/* Day header */}
        <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-t-xl border-b border-border/60 ${
          isToday ? "bg-primary/5" : currentStatus === "COMPLETED" ? "bg-emerald-50/60 dark:bg-emerald-950/20" : ""
        }`}>
          <div>
            <p className={`text-xs font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
              {formatDayLabel(date)}
            </p>
            {isToday && <p className="text-[10px] text-primary/70 font-medium">Today</p>}
          </div>
          {dailyTask && total > 0 && (
            <span className="text-[10px] font-semibold text-muted-foreground">{done}/{total}</span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 p-3 space-y-2">
          {dailyTask ? (
            <div className="space-y-2">
              {/* Show plan title only if it's not the auto-generated placeholder */}
              {dailyTask.title !== "Day's plan" && (
                <p className="text-xs font-semibold leading-tight text-foreground line-clamp-2">
                  {dailyTask.title}
                </p>
              )}
              {dailyTask.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2">{dailyTask.description}</p>
              )}

              {/* Checklist */}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {dailyTask.checklistItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-1.5 group">
                    <button
                      onClick={() => toggle(item.id)}
                      disabled={!canEdit || togglingItem === item.id}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors"
                    >
                      {togglingItem === item.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : item.isCompleted
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        : <Circle className="h-3.5 w-3.5" />}
                    </button>
                    <p className={`text-[11px] leading-relaxed flex-1 ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                      {item.text}
                    </p>
                    {canEdit && (
                      <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add checklist + plan button */}
              {canEdit && (
                <div className="flex gap-1 pt-0.5">
                  <Input
                    placeholder="Add checklist item…"
                    className="h-6 text-[11px] px-2"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
                  />
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" disabled={addingItem} onClick={addItem}>
                    {addingItem ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            canEdit ? (
              <button
                onClick={() => setPlanOpen(true)}
                className="w-full min-h-[60px] flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/3 transition-colors text-muted-foreground hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs font-medium">Write plan</span>
              </button>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-4">No plan yet</p>
            )
          )}
        </div>

        {/* ── Day status bar ── */}
        <div className="border-t border-border/60 flex rounded-b-xl overflow-hidden">
          {changingStatus ? (
            <div className="flex-1 flex items-center justify-center py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          ) : DAY_STATUS.map((opt) => (
            <button
              key={opt.value}
              disabled={!canEdit}
              onClick={() => currentStatus !== opt.value && changeDayStatus(opt.value)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors border-r last:border-r-0 border-border/60 disabled:cursor-not-allowed ${
                currentStatus === opt.value ? opt.active : opt.cls
              }`}
              title={opt.label}
            >
              <span className="text-sm leading-none">{opt.short}</span>
              <span className="hidden sm:inline text-[10px]">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Plan dialog */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Plan — {formatDayLabel(date)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>What will you do? <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Write unit tests for auth module"
                value={planForm.title}
                onChange={(e) => setPlanForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Details</Label>
              <Textarea
                placeholder="Break it down a bit more…"
                rows={3}
                value={planForm.description}
                onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes / blockers</Label>
              <Input
                placeholder="Any dependencies or blockers?"
                value={planForm.notes}
                onChange={(e) => setPlanForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanOpen(false)}>Cancel</Button>
            <Button onClick={savePlan} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── Main page ── */

export function WeeklyTaskPage({
  weeklyTask, canManage, isAssignee,
}: {
  weeklyTask: WeeklyTaskData;
  canManage: boolean;
  isAssignee: boolean;
}) {
  const router = useRouter();
  const canEdit = canManage || isAssignee;
  const [remark, setRemark] = useState(weeklyTask.managerRemark ?? "");
  const [savingRemark, setSavingRemark] = useState(false);

  const weekDates = getWeekDates(weeklyTask.project.createdAt, weeklyTask.weekNumber);
  const weekRange = formatWeekRange(weeklyTask.project.createdAt, weeklyTask.weekNumber);

  const taskByDate = new Map(
    weeklyTask.dailyTasks.map((dt) => [dt.date.slice(0, 10), dt]),
  );

  const totalItems  = weeklyTask.dailyTasks.flatMap((d) => d.checklistItems).length;
  const doneItems   = weeklyTask.dailyTasks.flatMap((d) => d.checklistItems).filter((c) => c.isCompleted).length;
  const daysPlanned = weeklyTask.dailyTasks.length;

  const assignedAt = new Date(weeklyTask.createdAt).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  function refresh() { router.refresh(); }

  async function handleSaveRemark() {
    setSavingRemark(true);
    try {
      const res = await fetch(
        `/api/projects/${weeklyTask.project.id}/weekly-tasks/${weeklyTask.id}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ managerRemark: remark || null }) },
      );
      if (!res.ok) { toast.error("Failed to save remark"); return; }
      toast.success("Remark saved");
      refresh();
    } finally { setSavingRemark(false); }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      {/* Back */}
      <Link
        href={`/projects/${weeklyTask.project.id}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {weeklyTask.project.name}
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 flex-wrap">
        <div className="relative shrink-0">
          <ProgressRing value={weeklyTask.progress} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{weeklyTask.progress}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              Week {weeklyTask.weekNumber}
            </span>
            <span className="text-xs text-muted-foreground">{weekRange}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight leading-tight">{weeklyTask.title}</h1>
          {weeklyTask.description && (
            <p className="text-sm text-muted-foreground mt-1">{weeklyTask.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> {weeklyTask.assignedTo.name}
              {weeklyTask.assignedTo.designation && ` — ${weeklyTask.assignedTo.designation}`}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Assigned {assignedAt}
              {weeklyTask.project.managerName && ` by ${weeklyTask.project.managerName}`}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
            <span><span className="font-semibold text-foreground">{daysPlanned}</span>/6 days planned</span>
            <span><span className="font-semibold text-foreground">{doneItems}</span>/{totalItems} items done</span>
          </div>
        </div>
      </div>

      {/* Employee instruction */}
      {isAssignee && daysPlanned < 6 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
          <span className="font-semibold text-primary">Your turn:</span> Click{" "}
          <span className="font-medium">"Plan this day"</span> on each day below to write what you'll work on.
        </div>
      )}

      {/* ── 6-day grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {weekDates.map((date) => {
          const dateKey = toLocalDateString(date);
          return (
            <DayCard
              key={dateKey}
              date={date}
              dailyTask={taskByDate.get(dateKey) ?? null}
              canEdit={canEdit}
              projectId={weeklyTask.project.id}
              weeklyTaskId={weeklyTask.id}
              onRefresh={refresh}
            />
          );
        })}
      </div>

      {/* ── Manager Remark ── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Manager Remark</p>
          {!canManage && weeklyTask.managerRemark && (
            <span className="text-xs text-muted-foreground ml-auto">From your manager</span>
          )}
        </div>

        {canManage ? (
          /* Manager can write/edit remark */
          <div className="space-y-2">
            <Textarea
              placeholder="Leave a remark for this employee's week — feedback, direction, blockers…"
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
            <Button
              size="sm"
              onClick={handleSaveRemark}
              disabled={savingRemark || remark === (weeklyTask.managerRemark ?? "")}
              className="gap-1.5"
            >
              {savingRemark ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Remark
            </Button>
          </div>
        ) : weeklyTask.managerRemark ? (
          /* Employee sees manager's remark read-only */
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
            <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">{weeklyTask.managerRemark}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No remark from manager yet.</p>
        )}
      </div>
    </div>
  );
}
