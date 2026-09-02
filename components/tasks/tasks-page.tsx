"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import {
  Plus, Search, MessageSquare, Calendar, User, ChevronLeft,
  ChevronRight, AlertCircle, Flame, ArrowUp, Minus,
  ListTodo, Loader2, CheckCircle2, Eye, Clock3,
  Building2, Briefcase, FolderKanban, ChevronRight as ArrowRight,
} from "lucide-react";
import { formatWeekRange } from "@/lib/utils/weeks";

/* ── Types ── */

interface WeeklyTaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  weekNumber: number;
  year: number;
  managerRemark: string | null;
  daysPlanned: number;
  project: { id: string; name: string; createdAt: string; teamName: string | null };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  createdBy: { name: string };
  assignedTo: { name: string; role: string; department: string | null } | null;
  commentCount: number;
}

interface AssignableUser {
  id: string;
  name: string;
  role: string;
  department: string | null;
  designation: string | null;
}

interface TaskStats {
  todo: number;
  inProgress: number;
  inReview: number;
  completed: number;
}

interface TasksPageProps {
  tasks: Task[];
  weeklyTasks: WeeklyTaskItem[];
  total: number;
  page: number;
  totalPages: number;
  canManage: boolean;
  isSuperAdmin: boolean;
  stats: TaskStats | null;
  assignableUsers: AssignableUser[];
}

/* ── Style maps ── */

const PRIORITY_STYLES: Record<string, { badge: string; border: string; label: string; icon: React.ReactNode }> = {
  URGENT: {
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
    border: "border-l-red-500",
    label: "Urgent",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  HIGH: {
    badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900",
    border: "border-l-orange-400",
    label: "High",
    icon: <Flame className="h-3.5 w-3.5" />,
  },
  MEDIUM: {
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
    border: "border-l-blue-400",
    label: "Medium",
    icon: <ArrowUp className="h-3.5 w-3.5" />,
  },
  LOW: {
    badge: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    border: "border-l-zinc-300 dark:border-l-zinc-600",
    label: "Low",
    icon: <Minus className="h-3.5 w-3.5" />,
  },
};

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  TODO:        { badge: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700", label: "To Do" },
  IN_PROGRESS: { badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900", label: "In Progress" },
  IN_REVIEW:   { badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900", label: "In Review" },
  COMPLETED:   { badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900", label: "Completed" },
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", HR: "HR", MANAGER: "Manager", EMPLOYEE: "Employee",
};

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  HR:          "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  MANAGER:     "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EMPLOYEE:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
};

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
}

/* ── Main component ── */

export function TasksPage({
  tasks,
  weeklyTasks,
  total,
  page,
  totalPages,
  canManage,
  isSuperAdmin,
  stats,
  assignableUsers,
}: TasksPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [updatingWt, setUpdatingWt] = useState<string | null>(null);

  const isEmployee = weeklyTasks.length > 0 || !canManage;

  async function handleWeeklyStatusChange(wtId: string, projectId: string, status: string) {
    setUpdatingWt(wtId);
    try {
      const res = await fetch(`/api/projects/${projectId}/weekly-tasks/${wtId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { toast.error("Failed to update"); return; }
      toast.success("Status updated");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setUpdatingWt(null);
    }
  }

  // Group assignable users by role for the form
  const groupedUsers = useMemo(() => {
    const groups: Record<string, AssignableUser[]> = { HR: [], MANAGER: [], EMPLOYEE: [] };
    for (const u of assignableUsers) {
      if (u.role in groups) groups[u.role].push(u);
    }
    return groups;
  }, [assignableUsers]);

  /* ── URL helpers ── */
  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") p.set(key, value);
    else p.delete(key);
    p.delete("page");
    router.push(`/tasks?${p.toString()}`);
  }

  function goToPage(n: number) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(n));
    router.push(`/tasks?${p.toString()}`);
  }

  function submitSearch(value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value.trim()) p.set("search", value.trim());
    else p.delete("search");
    p.delete("page");
    router.push(`/tasks?${p.toString()}`);
  }

  /* ── Create task ── */
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    fd.forEach((v, k) => { if (v) payload[k] = v as string; });

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to create task"); return; }
      toast.success("Task created successfully");
      setCreateOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  /* ── Status change inline ── */
  async function handleStatusChange(taskId: string, status: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { toast.error("Failed to update status"); return; }
      toast.success("Status updated");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
  }

  const currentStatus = searchParams.get("status") || "all";
  const currentPriority = searchParams.get("priority") || "all";
  const currentAssigneeRole = searchParams.get("assigneeRole") || "all";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Tasks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {canManage ? "Manage and assign tasks across your team" : "Your assigned tasks"}
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Task
          </Button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<ListTodo className="h-4 w-4" />}  label="To Do"      value={stats.todo}       color="zinc" />
          <StatCard icon={<Loader2 className="h-4 w-4" />}   label="In Progress" value={stats.inProgress} color="blue" />
          <StatCard icon={<Eye className="h-4 w-4" />}       label="In Review"  value={stats.inReview}   color="amber" />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={stats.completed} color="emerald" />
        </div>
      )}

      {/* ── My Project Tasks (employees) ── */}
      {weeklyTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">My Project Tasks</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {weeklyTasks.length}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {weeklyTasks.map((wt) => (
              <WeeklyTaskCard
                key={wt.id}
                wt={wt}
                isUpdating={updatingWt === wt.id}
                onStatusChange={(v) => handleWeeklyStatusChange(wt.id, wt.project.id, v)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── General task system (managers / admins only) ── */}
      {canManage && <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search tasks…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitSearch(searchValue); }}
            onBlur={() => submitSearch(searchValue)}
          />
        </div>

        <Select defaultValue={currentStatus} onValueChange={(v) => setParam("status", v)}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-28">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="IN_REVIEW">In Review</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue={currentPriority} onValueChange={(v) => setParam("priority", v)}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-28">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>

        {isSuperAdmin && (
          <Select defaultValue={currentAssigneeRole} onValueChange={(v) => setParam("assigneeRole", v)}>
            <SelectTrigger className="h-8 text-sm w-auto min-w-32">
              <SelectValue placeholder="Assignee Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
        )}

        <span className="text-xs text-muted-foreground ml-auto">{total} task{total !== 1 ? "s" : ""}</span>
      </div>}

      {canManage && <>{/* Task cards */}
      {tasks.length === 0 ? (
        <EmptyState canManage={canManage} onNew={() => setCreateOpen(true)} />
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canManage={canManage}
              onClick={() => router.push(`/tasks/${task.id}`)}
              onStatusChange={(s) => handleStatusChange(task.id, s)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-1.5">
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Task Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 gap-0 flex flex-col" side="right">
          <SheetHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-border shrink-0">
            <SheetTitle>Create New Task</SheetTitle>
            <p className="text-sm text-muted-foreground">Assign a task to any team member</p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleCreate} className="space-y-5 px-4 sm:px-6 py-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="What needs to be done?"
                className="text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Add more details about this task…"
                className="text-sm resize-none"
              />
            </div>

            <Separator />

            {/* Priority & Due Date */}
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select name="priority" defaultValue="MEDIUM">
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: "URGENT", label: "🔴 Urgent" },
                      { value: "HIGH",   label: "🟠 High" },
                      { value: "MEDIUM", label: "🔵 Medium" },
                      { value: "LOW",    label: "⚪ Low" },
                    ].map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" className="text-sm" />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Initial Status</Label>
              <Select name="status" defaultValue="TODO">
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Assign To — grouped by role */}
            <div className="space-y-1.5">
              <Label>Assign To</Label>
              <Select name="assignedToId">
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select team member…" />
                </SelectTrigger>
                <SelectContent>
                  {groupedUsers.HR.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                        <span className="h-2 w-2 rounded-full bg-violet-500 inline-block" />
                        HR
                      </SelectLabel>
                      {groupedUsers.HR.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex flex-col">
                            <span>{u.name}</span>
                            {u.department && (
                              <span className="text-xs text-muted-foreground">{u.department}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  {groupedUsers.MANAGER.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                        Managers
                      </SelectLabel>
                      {groupedUsers.MANAGER.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex flex-col">
                            <span>{u.name}</span>
                            {(u.department || u.designation) && (
                              <span className="text-xs text-muted-foreground">
                                {[u.designation, u.department].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  {groupedUsers.EMPLOYEE.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        Employees
                      </SelectLabel>
                      {groupedUsers.EMPLOYEE.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex flex-col">
                            <span>{u.name}</span>
                            {(u.department || u.designation) && (
                              <span className="text-xs text-muted-foreground">
                                {[u.designation, u.department].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  {assignableUsers.length === 0 && (
                    <div className="py-3 text-center text-sm text-muted-foreground">
                      No team members available
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Leave empty to create an unassigned task</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Creating…</>
                ) : (
                  <><Plus className="h-3.5 w-3.5 mr-1.5" /> Create Task</>
                )}
              </Button>
            </div>
          </form>
          </div>
        </SheetContent>
      </Sheet>
      </>}
    </div>
  );
}

/* ── Task Card ── */

function TaskCard({
  task,
  canManage,
  onClick,
  onStatusChange,
}: {
  task: Task;
  canManage: boolean;
  onClick: () => void;
  onStatusChange: (status: string) => void;
}) {
  const priority = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.MEDIUM;
  const status = STATUS_STYLES[task.status] ?? STATUS_STYLES.TODO;
  const overdue = isOverdue(task.dueDate) && task.status !== "COMPLETED";

  return (
    <div
      className={`rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors cursor-pointer border-l-4 ${priority.border}`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs shrink-0 gap-1 ${priority.badge}`}>
                {priority.icon}
                {priority.label}
              </Badge>
              <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          {/* Right: status select */}
          <div onClick={(e) => e.stopPropagation()}>
            <Select defaultValue={task.status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-auto border-0 shadow-none px-0 py-0 focus:ring-0 w-auto">
                <Badge variant="outline" className={`text-xs cursor-pointer ${status.badge}`}>
                  {status.label}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bottom meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-xs text-muted-foreground">
          {/* Assignee */}
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 shrink-0" />
              <span className="font-medium text-foreground">{task.assignedTo.name}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[task.assignedTo.role] ?? ""}`}>
                {ROLE_LABELS[task.assignedTo.role] ?? task.assignedTo.role}
              </span>
              {task.assignedTo.department && (
                <span className="flex items-center gap-0.5">
                  <Building2 className="h-3 w-3" />
                  {task.assignedTo.department}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 italic">
              <User className="h-3 w-3" />
              Unassigned
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${overdue ? "text-red-600 dark:text-red-400 font-medium" : ""}`}>
              <Calendar className="h-3 w-3" />
              {overdue && <AlertCircle className="h-3 w-3" />}
              {formatDate(task.dueDate)}
            </div>
          )}

          {/* Comments */}
          {task.commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.commentCount}
            </div>
          )}

          {/* Created by */}
          <div className="flex items-center gap-1 ml-auto">
            <Clock3 className="h-3 w-3" />
            <span>by {task.createdBy.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ── */

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "zinc" | "blue" | "amber" | "emerald";
}) {
  const styles = {
    zinc:    { bg: "bg-zinc-50 dark:bg-zinc-900/50",      icon: "text-zinc-400",    num: "text-zinc-700 dark:text-zinc-300" },
    blue:    { bg: "bg-blue-50 dark:bg-blue-950/30",      icon: "text-blue-500",    num: "text-blue-700 dark:text-blue-400" },
    amber:   { bg: "bg-amber-50 dark:bg-amber-950/30",    icon: "text-amber-500",   num: "text-amber-700 dark:text-amber-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-500", num: "text-emerald-700 dark:text-emerald-400" },
  }[color];

  return (
    <div className={`rounded-xl border border-border ${styles.bg} p-4 flex items-start gap-3`}>
      <div className={`mt-0.5 ${styles.icon}`}>{icon}</div>
      <div>
        <p className={`text-xl font-semibold tabular-nums ${styles.num}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Weekly Task Card (employee project task) ── */

const WT_STATUS_OPTIONS = [
  { value: "TODO",        label: "Not Started", short: "Not Started", icon: "○", cls: "border-zinc-300 text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 dark:border-zinc-600 dark:text-zinc-400" },
  { value: "IN_PROGRESS", label: "Preparing",   short: "Preparing",   icon: "↺", cls: "border-blue-400 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-600 dark:text-blue-400" },
  { value: "COMPLETED",   label: "Completed",   short: "Completed",   icon: "✓", cls: "border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-600 dark:text-emerald-400" },
] as const;

function WeeklyTaskCard({
  wt, isUpdating, onStatusChange,
}: {
  wt: WeeklyTaskItem;
  isUpdating: boolean;
  onStatusChange: (status: string) => void;
}) {
  const current = WT_STATUS_OPTIONS.find((o) => o.value === wt.status) ?? WT_STATUS_OPTIONS[0];

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Card header — project colour strip */}
      <div className="h-1.5 bg-primary/70 w-full" />

      <div className="p-4 flex-1 space-y-3">
        {/* Project + team */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <FolderKanban className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-sm font-semibold leading-tight">{wt.project.name}</p>
            </div>
            {wt.project.teamName && (
              <p className="text-[11px] text-muted-foreground">Team: {wt.project.teamName}</p>
            )}
          </div>
          <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
            W{wt.weekNumber}
          </span>
        </div>

        {/* Week date range */}
        <p className="text-[11px] text-muted-foreground">
          {formatWeekRange(wt.project.createdAt, wt.weekNumber)}
        </p>

        {/* Task title */}
        <div>
          <p className="text-sm font-medium leading-snug">{wt.title}</p>
          {wt.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{wt.description}</p>
          )}
        </div>

        {/* Manager remark */}
        {wt.managerRemark && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-0.5">Manager Remark</p>
            <p className="text-xs text-amber-900 dark:text-amber-300">{wt.managerRemark}</p>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{wt.daysPlanned}/6 days planned</span>
            <span className="font-semibold text-primary">{wt.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, wt.progress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status bar — 3 buttons + open link */}
      <div className="border-t border-border">
        {isUpdating ? (
          <div className="flex items-center justify-center py-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex">
            {WT_STATUS_OPTIONS.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-semibold border-r last:border-r-0 border-border transition-colors ${
                  wt.status === opt.value
                    ? opt.cls
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
                title={opt.label}
              >
                <span className="text-base leading-none">{opt.icon}</span>
                <span className="hidden sm:inline">{opt.short}</span>
              </button>
            ))}
            <Link
              href={`/projects/${wt.project.id}/weekly-tasks/${wt.id}`}
              className="px-3 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors border-l border-border"
              title="Open task detail"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Empty State ── */

function EmptyState({ canManage, onNew }: { canManage: boolean; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <ListTodo className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No tasks found</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        {canManage ? "Create a task to get your team started" : "You have no tasks assigned yet"}
      </p>
      {canManage && (
        <Button size="sm" onClick={onNew} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Task
        </Button>
      )}
    </div>
  );
}
