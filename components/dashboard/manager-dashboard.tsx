import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { StatCard } from "./stat-card";
import { Users, UserCheck, CalendarOff, CheckSquare, ArrowRight, Crown } from "lucide-react";
import { formatDate, getTodayDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

async function getManagerDashboardData(session: SessionPayload) {
  const today = getTodayDate();

  // Get managed teams
  const managedTeams = session.employeeId
    ? await prisma.team.findMany({
        where: { managerId: session.employeeId, isActive: true },
        include: {
          members: {
            include: {
              employee: {
                include: {
                  user: { select: { role: true } },
                  department: { select: { name: true } },
                  designation: { select: { name: true } },
                },
              },
            },
          },
        },
      })
    : [];

  // Collect all team member employee IDs
  const teamMemberIds = managedTeams
    .flatMap((t) => t.members.map((m) => m.employee.id));

  const [teamPresentToday, pendingLeaves, openTasks, pendingLeaveRequests, teamTasks] =
    await Promise.all([
      teamMemberIds.length > 0
        ? prisma.attendance.count({
            where: {
              date: today,
              status: { in: ["PRESENT", "HALF_DAY"] },
              employeeId: { in: teamMemberIds },
            },
          })
        : Promise.resolve(0),
      teamMemberIds.length > 0
        ? prisma.leaveRequest.count({
            where: {
              status: "PENDING",
              employeeId: { in: teamMemberIds },
            },
          })
        : Promise.resolve(0),
      prisma.task.count({
        where: {
          status: { not: "COMPLETED" },
          assignedTo: session.employeeId
            ? undefined
            : undefined,
        },
      }),
      teamMemberIds.length > 0
        ? prisma.leaveRequest.findMany({
            where: {
              status: "PENDING",
              employeeId: { in: teamMemberIds },
            },
            include: {
              employee: { select: { firstName: true, lastName: true } },
              leaveType: { select: { name: true } },
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
    ]);

  const totalTeamMembers = teamMemberIds.length;

  return {
    managedTeams,
    totalTeamMembers,
    teamPresentToday,
    pendingLeaves,
    openTasks,
    pendingLeaveRequests,
    teamTasks,
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

interface ManagerDashboardProps {
  session: SessionPayload;
}

export async function ManagerDashboard({ session }: ManagerDashboardProps) {
  const data = await getManagerDashboardData(session);
  const attendancePct =
    data.totalTeamMembers > 0
      ? Math.round((data.teamPresentToday / data.totalTeamMembers) * 100)
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDate(new Date())}</p>
        </div>
        {data.pendingLeaves > 0 && (
          <Link
            href="/leaves"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-full transition-colors"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {data.pendingLeaves}
            </span>
            Team leave requests
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Team Members"
          value={data.totalTeamMembers}
          icon={Users}
          description={`${data.managedTeams.length} team${data.managedTeams.length !== 1 ? "s" : ""}`}
          accent="blue"
        />
        <StatCard
          label="Present Today"
          value={data.teamPresentToday}
          icon={UserCheck}
          description={`${attendancePct}% team attendance`}
          accent="green"
        />
        <StatCard
          label="Pending Leaves"
          value={data.pendingLeaves}
          icon={CalendarOff}
          description="Awaiting review"
          accent={data.pendingLeaves > 0 ? "amber" : "default"}
        />
        <StatCard
          label="Open Tasks"
          value={data.openTasks}
          icon={CheckSquare}
          description="Across all tasks"
          accent="violet"
        />
      </div>

      {/* Team attendance bar */}
      {data.totalTeamMembers > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Team Attendance Today</h3>
            <span className="text-xs text-muted-foreground">
              {data.teamPresentToday} / {data.totalTeamMembers} members
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${attendancePct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{attendancePct}% of team present</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My teams */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-medium text-foreground">My Teams</h3>
            </div>
            <Link
              href="/teams"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {data.managedTeams.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground">No teams assigned to you yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.managedTeams.map((team) => (
                <li key={team.id}>
                  <Link
                    href={`/teams/${team.id}`}
                    className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{team.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {team.members.slice(0, 3).map((m, i) => (
                        <div
                          key={m.id}
                          className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center ring-2 ring-card"
                          style={{ marginLeft: i > 0 ? "-8px" : 0 }}
                          title={`${m.employee.firstName} ${m.employee.lastName}`}
                        >
                          {m.employee.firstName[0]}{m.employee.lastName[0]}
                        </div>
                      ))}
                      {team.members.length > 3 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          +{team.members.length - 3}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending leave requests */}
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
              Review <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {data.pendingLeaveRequests.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground">No pending leave requests</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.pendingLeaveRequests.map((req) => (
                <li key={req.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-700 dark:text-amber-400 text-xs font-semibold shrink-0">
                      {req.employee.firstName[0]}{req.employee.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {req.employee.firstName} {req.employee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.leaveType.name} · {req.totalDays}d
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs shrink-0 text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900"
                  >
                    Pending
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Open Tasks</h3>
          </div>
          <Link
            href="/tasks"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Manage tasks <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {data.teamTasks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">No open tasks</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.teamTasks.map((task) => {
              const assignee = task.assignedTo?.employee;
              return (
                <li key={task.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[task.status])} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignee ? `${assignee.firstName} ${assignee.lastName}` : "Unassigned"}
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
  );
}
