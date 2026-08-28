import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { StatCard } from "./stat-card";
import { Users, Clock, CalendarOff, CheckSquare, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalEmployees,
    presentToday,
    onLeaveToday,
    pendingLeaves,
    openTasks,
    recentLeaves,
    recentTasks,
  ] = await Promise.all([
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
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
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

  return {
    totalEmployees,
    presentToday,
    onLeaveToday,
    pendingLeaves,
    openTasks,
    recentLeaves,
    recentTasks,
  };
}

interface AdminDashboardProps {
  session: SessionPayload;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  LOW: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export async function AdminDashboard({ session }: AdminDashboardProps) {
  const stats = await getDashboardStats();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold">Overview</h2>
        <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          description="Active headcount"
        />
        <StatCard
          label="Present Today"
          value={stats.presentToday}
          icon={UserCheck}
          description={`${stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}% attendance`}
        />
        <StatCard
          label="On Leave"
          value={stats.onLeaveToday}
          icon={CalendarOff}
          description="Approved leave today"
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pendingLeaves}
          icon={Clock}
          description="Leave requests"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending leave requests */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="text-sm font-medium">Pending Leave Requests</h3>
            <span className="text-xs text-muted-foreground">{stats.pendingLeaves} total</span>
          </div>
          {stats.recentLeaves.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No pending requests
            </div>
          ) : (
            <ul className="divide-y">
              {stats.recentLeaves.map((req) => (
                <li key={req.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {req.employee.firstName} {req.employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.leaveType.name} · {formatDate(req.startDate)} – {formatDate(req.endDate)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 text-amber-600 border-amber-200 bg-amber-50">
                    Pending
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Open tasks */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="text-sm font-medium">Open Tasks</h3>
            <span className="text-xs text-muted-foreground">{stats.openTasks} total</span>
          </div>
          {stats.recentTasks.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No open tasks
            </div>
          ) : (
            <ul className="divide-y">
              {stats.recentTasks.map((task) => {
                const assignee = task.assignedTo?.employee;
                return (
                  <li key={task.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignee
                          ? `${assignee.firstName} ${assignee.lastName}`
                          : "Unassigned"}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${
                        PRIORITY_COLORS[task.priority] || ""
                      }`}
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
