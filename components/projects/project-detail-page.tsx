"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Users, Calendar, Clock, CheckSquare, Plus,
  Loader2, History, UserCheck, ChevronRight, FileText,
  Edit, Trash2, UsersRound,
} from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { getTotalProjectWeeks, formatWeekRange, getWeekDates } from "@/lib/utils/weeks";

/* ── Types ── */

interface EmployeeRef {
  id: string; name: string; designation: string | null; profileImage: string | null; userRole?: string;
}

interface ManagerHistoryEntry {
  id: string;
  assignedAt: string;
  removedAt: string | null;
  manager: EmployeeRef;
  changedBy: string;
}

interface WeeklyTask {
  id: string; title: string; status: string; progress: number;
  weekNumber: number; year: number; dueDate: string | null;
  dailyTaskCount: number;
  assignedTo: { id: string; name: string; profileImage: string | null };
}

interface WorkNote {
  id: string; content: string; createdAt: string;
  employee: { id: string; name: string; profileImage: string | null };
}

interface ProjectDetail {
  id: string; name: string; description: string | null; status: string;
  deadline: string | null; createdAt: string; createdBy: string;
  team: { id: string; name: string } | null;
  manager: (EmployeeRef & { designation: string | null }) | null;
  members: { id: string; role: string; joinedAt: string; employee: EmployeeRef & { userRole: string } }[];
  managerHistory: ManagerHistoryEntry[];
  weeklyTasks: WeeklyTask[];
  workNotes: WorkNote[];
}

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ON_HOLD: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLETED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  TODO: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_REVIEW: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};
const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning", ACTIVE: "Active", ON_HOLD: "On Hold", COMPLETED: "Completed",
  TODO: "To Do", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review",
};

function Avatar({ name, image, size = "sm" }: { name: string; image?: string | null; size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-9 w-9 text-sm" : "h-7 w-7 text-xs";
  if (image) return <img src={image} alt={name} className={`${dim} rounded-full object-cover`} />;
  return (
    <div className={`${dim} rounded-full bg-primary/15 flex items-center justify-center font-semibold text-primary`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export function ProjectDetailPage({
  project, allEmployees, sessionRole, sessionEmployeeId, isAdmin,
}: {
  project: ProjectDetail;
  allEmployees: { id: string; name: string; designation: string | null }[];
  sessionRole: string;
  sessionEmployeeId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "notes" | "history">("overview");
  const [changingManager, setChangingManager] = useState(false);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [newManagerId, setNewManagerId] = useState("");
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ weekNumber: "", assignedToId: "", title: "", description: "" });
  const [assigningTask, setAssigningTask] = useState(false);

  const avgProgress = project.weeklyTasks.length > 0
    ? Math.round(project.weeklyTasks.reduce((s, t) => s + t.progress, 0) / project.weeklyTasks.length)
    : 0;

  async function handleChangeManager() {
    if (!newManagerId) { toast.error("Select a manager"); return; }
    setChangingManager(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/manager`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: newManagerId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to change manager"); return; }
      toast.success("Manager updated — history recorded");
      setManagerDialogOpen(false);
      setNewManagerId("");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setChangingManager(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/work-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText }),
      });
      if (!res.ok) { toast.error("Failed to add note"); return; }
      toast.success("Note added");
      setNoteText("");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAddingNote(false);
    }
  }

  async function handleStatusChange(status: string) {
    setStatusChanging(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { toast.error("Failed to update status"); return; }
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setStatusChanging(false);
    }
  }

  async function handleAssignTask() {
    if (!assignForm.weekNumber) { toast.error("Select a week"); return; }
    if (!assignForm.assignedToId) { toast.error("Select an employee"); return; }
    if (!assignForm.title.trim()) { toast.error("Enter a task title"); return; }
    setAssigningTask(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/weekly-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber: parseInt(assignForm.weekNumber),
          year: getWeekDates(project.createdAt, parseInt(assignForm.weekNumber))[0].getFullYear(),
          assignedToId: assignForm.assignedToId,
          title: assignForm.title,
          description: assignForm.description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to assign task"); return; }
      toast.success("Weekly task assigned");
      setAssignTaskOpen(false);
      setAssignForm({ weekNumber: "", assignedToId: "", title: "", description: "" });
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAssigningTask(false);
    }
  }

  const totalWeeks = getTotalProjectWeeks(project.createdAt, project.deadline);
  const weekOptions = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  const isEmployee = sessionRole === "EMPLOYEE";

  const tabs: { id: "overview" | "tasks" | "notes" | "history"; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: isEmployee ? `My Tasks (${project.weeklyTasks.length})` : `Weekly Tasks (${project.weeklyTasks.length})` },
    ...(!isEmployee ? [
      { id: "notes" as const, label: `Work Notes (${project.workNotes.length})` },
      { id: "history" as const, label: "Manager History" },
    ] : []),
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            {project.team && (
              <span className="flex items-center gap-1 font-semibold text-foreground/80">
                <UsersRound className="h-3.5 w-3.5 text-primary" /> {project.team.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Created {formatDate(project.createdAt)}
            </span>
            {project.deadline && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Due {formatDate(project.deadline)}
              </span>
            )}
            <span>by {project.createdBy}</span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Select value={project.status} onValueChange={handleStatusChange} disabled={statusChanging}>
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Progress banner */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-bold text-primary">{avgProgress}%</span>
        </div>
        <ProgressBar value={avgProgress} />
        <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
          <span><span className="font-semibold text-foreground">{project.members.length}</span> members</span>
          <span><span className="font-semibold text-foreground">{project.weeklyTasks.length}</span> weekly tasks</span>
          <span><span className="font-semibold text-foreground">{project.workNotes.length}</span> work notes</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Manager card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> Project Manager
              </h3>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => setManagerDialogOpen(true)}
                >
                  <Edit className="h-3 w-3" /> Change
                </Button>
              )}
            </div>
            {project.manager ? (
              <div className="flex items-center gap-3">
                <Avatar name={project.manager.name} image={project.manager.profileImage} size="md" />
                <div>
                  <p className="font-medium text-sm">{project.manager.name}</p>
                  {project.manager.designation && (
                    <p className="text-xs text-muted-foreground">{project.manager.designation}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No manager assigned yet.</p>
            )}
            {project.managerHistory.length > 1 && (
              <button
                onClick={() => setActiveTab("history")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <History className="h-3 w-3" />
                View manager history ({project.managerHistory.length} entries)
              </button>
            )}
          </div>

          {/* Team members */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Team Members
              </h3>
              {(isAdmin || sessionRole === "MANAGER") && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  Click + to assign weekly work
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {project.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 group">
                  <Avatar name={m.employee.name} image={m.employee.profileImage} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.employee.name}</p>
                    {m.employee.designation && (
                      <p className="text-xs text-muted-foreground truncate">{m.employee.designation}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                    m.role === "LEAD" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {m.role}
                  </span>
                  {(isAdmin || sessionRole === "MANAGER") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={`Assign weekly task to ${m.employee.name}`}
                      onClick={() => {
                        setAssignForm((f) => ({ ...f, assignedToId: m.employee.id }));
                        setAssignTaskOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {project.members.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No members yet.</p>
              )}
            </div>
            {(isAdmin || sessionRole === "MANAGER") && project.members.length > 0 && (
              <Button
                size="sm"
                className="w-full gap-1.5 mt-1"
                onClick={() => {
                  setAssignForm((f) => ({ ...f, assignedToId: "" }));
                  setAssignTaskOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Assign Weekly Task
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tab: Weekly Tasks */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{isEmployee ? "My Weekly Tasks" : "Weekly Tasks"}</h3>
            {(isAdmin || sessionRole === "MANAGER") && (
              <Button size="sm" className="gap-1" onClick={() => setAssignTaskOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Assign Weekly Task
              </Button>
            )}
          </div>
          {project.weeklyTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {isEmployee ? "No tasks assigned to you yet." : "No weekly tasks assigned yet."}
            </p>
          ) : (
            <div className="space-y-2">
              {project.weeklyTasks.map((wt) => (
                <Link
                  key={wt.id}
                  href={`/projects/${project.id}/weekly-tasks/${wt.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        W{wt.weekNumber}
                      </span>
                      <p className="font-medium text-sm truncate">{wt.title}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[wt.status]}`}>
                        {STATUS_LABELS[wt.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-foreground/60 font-medium">
                        {formatWeekRange(project.createdAt, wt.weekNumber)}
                      </span>
                      <span>·</span>
                      <Avatar name={wt.assignedTo.name} image={wt.assignedTo.profileImage} size="sm" />
                      <span>{wt.assignedTo.name}</span>
                      <span>·</span>
                      <span>{wt.dailyTaskCount} days planned</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar value={wt.progress} />
                      <span className="text-xs font-semibold text-primary shrink-0">{wt.progress}%</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Work Notes */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <Label className="text-sm font-semibold">Add Work Note</Label>
            <Textarea
              placeholder="Log your progress, blockers, or updates…"
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button size="sm" onClick={handleAddNote} disabled={addingNote || !noteText.trim()}>
              {addingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Post Note
            </Button>
          </div>

          <div className="space-y-3">
            {project.workNotes.map((n) => (
              <div key={n.id} className="flex gap-3 p-4 rounded-lg border border-border/60 bg-card">
                <Avatar name={n.employee.name} image={n.employee.profileImage} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{n.employee.name}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{n.content}</p>
                </div>
              </div>
            ))}
            {project.workNotes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No work notes yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Manager History */}
      {activeTab === "history" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Full audit trail of every manager change. The current manager has no end date.
          </p>
          {project.managerHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-6 text-center">No manager history recorded yet.</p>
          ) : (
            <div className="relative pl-5">
              {/* Timeline line */}
              <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {project.managerHistory.map((h, i) => (
                  <div key={h.id} className="relative">
                    {/* Dot */}
                    <div className={`absolute -left-[17px] top-2 h-3 w-3 rounded-full border-2 ${
                      h.removedAt === null ? "bg-primary border-primary" : "bg-background border-border"
                    }`} />
                    <div className="ml-4 rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <Avatar name={h.manager.name} image={h.manager.profileImage} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{h.manager.name}</p>
                            {h.manager.designation && (
                              <span className="text-xs text-muted-foreground">— {h.manager.designation}</span>
                            )}
                            {h.removedAt === null && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                            <p>
                              <span className="font-medium">Assigned:</span>{" "}
                              {new Date(h.assignedAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                            {h.removedAt && (
                              <p>
                                <span className="font-medium">Removed:</span>{" "}
                                {new Date(h.removedAt).toLocaleDateString("en-IN", {
                                  day: "numeric", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </p>
                            )}
                            <p className="text-muted-foreground/70">Changed by: {h.changedBy}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Weekly Task Dialog */}
      <Dialog open={assignTaskOpen} onOpenChange={(open) => {
        setAssignTaskOpen(open);
        if (!open) setAssignForm({ weekNumber: "", assignedToId: "", title: "", description: "" });
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {assignForm.assignedToId
                ? `Assign Task — ${project.members.find((m) => m.employee.id === assignForm.assignedToId)?.employee.name ?? ""}`
                : "Assign Weekly Task"}
            </DialogTitle>
          </DialogHeader>

          {/* Instruction banner */}
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Select which <span className="font-semibold text-foreground">week</span> and which{" "}
            <span className="font-semibold text-foreground">team member</span> you're assigning this work to.
            The employee will then plan their 6-day schedule for that week.
          </div>

          <div className="space-y-4 py-1">
            {/* Week selector */}
            <div className="space-y-1.5">
              <Label>Week <span className="text-destructive">*</span></Label>
              <Select value={assignForm.weekNumber} onValueChange={(v) => setAssignForm((f) => ({ ...f, weekNumber: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a week…" />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map((w) => (
                    <SelectItem key={w} value={String(w)}>
                      Week {w} — {formatWeekRange(project.createdAt, w)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee selector */}
            <div className="space-y-1.5">
              <Label>Assign To <span className="text-destructive">*</span></Label>
              <Select value={assignForm.assignedToId} onValueChange={(v) => setAssignForm((f) => ({ ...f, assignedToId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member…" />
                </SelectTrigger>
                <SelectContent>
                  {project.members.map((m) => (
                    <SelectItem key={m.employee.id} value={m.employee.id}>
                      {m.employee.name}{m.employee.designation ? ` — ${m.employee.designation}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task title */}
            <div className="space-y-1.5">
              <Label>Task Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Implement login & auth module"
                value={assignForm.title}
                onChange={(e) => setAssignForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus={!!assignForm.assignedToId}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Instructions / Description</Label>
              <Textarea
                placeholder="What should this employee accomplish this week?"
                rows={3}
                value={assignForm.description}
                onChange={(e) => setAssignForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTaskOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignTask} disabled={assigningTask}>
              {assigningTask ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Assign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Manager Dialog */}
      <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Project Manager</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              The current manager will be recorded in history with the exact time of change.
            </p>
            <div className="space-y-1.5">
              <Label>New Manager</Label>
              <Select value={newManagerId} onValueChange={setNewManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {allEmployees
                    .filter((e) => e.id !== project.manager?.id)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}{e.designation ? ` — ${e.designation}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagerDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeManager} disabled={changingManager || !newManagerId}>
              {changingManager ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
