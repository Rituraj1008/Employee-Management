import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { StatCard } from "./stat-card";
import { Users, Clock, CalendarOff, UserCheck, Crown, CheckSquare, ArrowRight } from "lucide-react";
import { formatDate, getTodayDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { RoleType } from "@prisma/client";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const teamDelegate = (prisma as any).team as typeof prisma.team | undefined;

async function getDashboardStats(session: SessionPayload) {
  const today = getTodayDate();
  const isManager = session.role === RoleType.MANAGER;

  const [
    totalEmployees,
    activeEmployees,
    presentToday,
    onLeaveToday,
    pendingLeaves,
    openTasks,
    teams,
    recentTasks,
    departments,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.attendance.count({
      where: { date: today, status: { in: ["PRESENT", "HALF_DAY"] } },
    }),
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.task.count({ where: { status: { not: "COMPLETED" } } }),
    teamDelegate
      ? teamDelegate.findMany({
          where: isManager && session.employeeId
            ? { managerId: session.employeeId, isActive: true }
            : { isActive: true },
          include: {
            manager: { select: { firstName: true, lastName: true } },
            _count: { select: { members: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    prisma.task.findMany({
      where: { status: { not: "COMPLETED" } },
      include: {
        assignedTo: {
          select: { employee: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.department.count({ where: { isActive: true } }),
  ]);

  return {
    totalEmployees,
    activeEmployees,
    presentToday,
    onLeaveToday,
    pendingLeaves,
    openTasks,
    teams,
    recentTasks,
    departments,
  };
}

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  LOW: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

const STATUS_DOT: Record<string, string> = {
  TODO: "bg-zinc-400",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-amber-500",
  COMPLETED: "bg-emerald-500",
};

interface AdminDashboardProps {
  session: SessionPayload;
}

export async function AdminDashboard({ session }: AdminDashboardProps) {
  const stats = await getDashboardStats(session);
  const isManager = session.role === RoleType.MANAGER;
  const attendancePct =
    stats.activeEmployees > 0
      ? Math.round((stats.presentToday / stats.activeEmployees) * 100)
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {isManager ? "Team Overview" : "Organization Overview"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDate(new Date())}</p>
        </div>
        {stats.pendingLeaves > 0 && (
          <Link
            href="/leaves"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-full transition-colors"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {stats.pendingLeaves}
            </span>
            Pending approvals
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Employees"
          value={stats.activeEmployees}
          icon={Users}
          description={`${stats.totalEmployees} total headcount`}
          accent="blue"
        />
        <StatCard
          label="Present Today"
          value={stats.presentToday}
          icon={UserCheck}
          description={`${attendancePct}% attendance rate`}
          accent="green"
        />
        <StatCard
          label="On Leave Today"
          value={stats.onLeaveToday}
          icon={CalendarOff}
          description="Approved leave"
          accent="amber"
        />
        <StatCard
          label="Pending Requests"
          value={stats.pendingLeaves}
          icon={Clock}
          description="Leave approvals"
          accent={stats.pendingLeaves > 0 ? "red" : "default"}
        />
      </div>

      {/* Attendance bar */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Today's Attendance</h3>
          <span className="text-xs text-muted-foreground">
            {stats.presentToday} / {stats.activeEmployees} employees
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${attendancePct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{attendancePct}% present</span>
          <div className="flex items-center gap-4">
            {!isManager && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                {stats.departments} departments
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
              {stats.openTasks} open tasks
            </span>
          </div>
        </div>
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Teams */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">
              {isManager ? "My Teams" : "Active Teams"}
            </h3>
            <Link
              href="/teams"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {stats.teams.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {isManager ? "No teams assigned to you" : "No active teams yet"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {stats.teams.map((team) => (
                <li key={team.id}>
                  <Link
                    href={`/teams/${team.id}`}
                    className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Crown className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.manager
                            ? `${team.manager.firstName} ${team.manager.lastName}`
                            : "No manager"}
                          {" · "}
                          {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs shrink-0 text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                    >
                      Active
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Open tasks */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Open Tasks</h3>
            <Link
              href="/tasks"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {stats.recentTasks.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No open tasks</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recentTasks.map((task) => {
                const assignee = task.assignedTo?.employee;
                return (
                  <li
                    key={task.id}
                    className="px-5 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[task.status])} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignee
                            ? `${assignee.firstName} ${assignee.lastName}`
                            : "Unassigned"}
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
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
