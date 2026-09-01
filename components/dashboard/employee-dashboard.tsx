import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { StatCard } from "./stat-card";
import { CheckCircle2, Clock, CalendarOff, CheckSquare, ArrowRight } from "lucide-react";
import { formatDate, formatTime, formatWorkingHours, getTodayDate, getCurrentYear } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { AttendanceCheckInOut } from "@/components/attendance/attendance-check-in-out";
import Link from "next/link";
import { cn } from "@/lib/utils";

async function getEmployeeDashboardData(employeeId: string) {
  const today = getTodayDate();
  const year = getCurrentYear();

  const [attendance, leaveBalances, myTasks, recentLeaves] = await Promise.all([
    prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    }),
    prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: { select: { name: true } } },
    }),
    prisma.task.findMany({
      where: {
        assignedTo: { employee: { id: employeeId } },
        status: { not: "COMPLETED" },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 5,
    }),
    prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  return { attendance, leaveBalances, myTasks, recentLeaves };
}

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  LOW: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  APPROVED: "text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  REJECTED: "text-red-700 border-red-200 bg-red-50 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  CANCELLED: "text-zinc-600 border-zinc-200 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

const STATUS_DOT: Record<string, string> = {
  TODO: "bg-zinc-400",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-amber-500",
  COMPLETED: "bg-emerald-500",
};

interface EmployeeDashboardProps {
  session: SessionPayload;
}

export async function EmployeeDashboard({ session }: EmployeeDashboardProps) {
  if (!session.employeeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Profile not configured</p>
          <p className="text-xs text-muted-foreground mt-1">
            Contact your HR team to set up your employee profile.
          </p>
        </div>
      </div>
    );
  }

  const data = await getEmployeeDashboardData(session.employeeId);
  const totalLeave = data.leaveBalances.reduce((sum, b) => sum + b.remainingDays, 0);

  const checkedIn = !!data.attendance?.checkInTime;
  const checkedOut = !!data.attendance?.checkOutTime;

  let statusValue = "Not checked in";
  let statusAccent: "blue" | "green" | "default" = "default";
  if (checkedOut) {
    statusValue = "Checked out";
    statusAccent = "default";
  } else if (checkedIn) {
    statusValue = "Checked in";
    statusAccent = "green";
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Good day</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{formatDate(new Date())}</p>
      </div>

      {/* Attendance card */}
      <AttendanceCheckInOut
        employeeId={session.employeeId}
        initialAttendance={
          data.attendance
            ? {
                id: data.attendance.id,
                checkInTime: data.attendance.checkInTime?.toISOString() ?? null,
                checkOutTime: data.attendance.checkOutTime?.toISOString() ?? null,
                workingMinutes: data.attendance.workingMinutes,
                teaBreakMinutes: data.attendance.teaBreakMinutes,
                lunchBreakMinutes: data.attendance.lunchBreakMinutes,
              }
            : null
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Today's Status"
          value={statusValue}
          icon={CheckCircle2}
          description={
            data.attendance?.checkInTime
              ? `Since ${formatTime(data.attendance.checkInTime)}`
              : "Check in to start tracking"
          }
          accent={statusAccent}
        />
        <StatCard
          label="Working Hours"
          value={
            data.attendance?.workingMinutes
              ? formatWorkingHours(data.attendance.workingMinutes)
              : data.attendance?.checkInTime
              ? "In progress"
              : "—"
          }
          icon={Clock}
          description="Today's logged hours"
          accent={data.attendance?.checkInTime && !data.attendance?.checkOutTime ? "blue" : "default"}
        />
        <StatCard
          label="Leave Balance"
          value={totalLeave}
          icon={CalendarOff}
          description={`${data.leaveBalances.length} leave type${data.leaveBalances.length !== 1 ? "s" : ""}`}
          accent="violet"
        />
      </div>

      {/* Leave balance breakdown */}
      {data.leaveBalances.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Leave Balances</h3>
            <Link
              href="/leaves"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Apply for leave <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.leaveBalances.map((balance) => {
              const usedPct =
                balance.totalDays > 0
                  ? Math.round((balance.usedDays / balance.totalDays) * 100)
                  : 0;
              return (
                <div key={balance.id} className="rounded-lg bg-muted/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{balance.leaveType.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {balance.remainingDays}/{balance.totalDays}d
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${100 - usedPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{balance.usedDays} days used</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My tasks */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">My Tasks</h3>
            </div>
            <Link
              href="/tasks"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {data.myTasks.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No open tasks</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks assigned to you will appear here
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.myTasks.map((task) => (
                <li key={task.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[task.status])} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {task.status.toLowerCase().replace(/_/g, " ")}
                        {task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 capitalize",
                      PRIORITY_BADGE[task.priority]
                    )}
                  >
                    {task.priority.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent leave requests */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-medium text-foreground">Leave Requests</h3>
            </div>
            <Link
              href="/leaves"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {data.recentLeaves.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CalendarOff className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No leave requests</p>
              <p className="text-xs text-muted-foreground mt-1">
                Apply for leave and track its status here
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentLeaves.map((req) => (
                <li key={req.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{req.leaveType.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(req.startDate)} – {formatDate(req.endDate)}{" "}
                      <span className="text-muted-foreground/60">({req.totalDays}d)</span>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs shrink-0", STATUS_BADGE[req.status])}
                  >
                    {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
