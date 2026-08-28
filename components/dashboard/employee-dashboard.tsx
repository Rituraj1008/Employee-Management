import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { StatCard } from "./stat-card";
import { CheckCircle2, Clock, CalendarOff, CheckSquare } from "lucide-react";
import { formatDate, formatTime, formatWorkingHours } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { AttendanceCheckInOut } from "@/components/attendance/attendance-check-in-out";
import { getCurrentYear } from "@/lib/utils/date";

async function getEmployeeDashboardData(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  LOW: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-600 border-amber-200 bg-amber-50",
  APPROVED: "text-green-700 border-green-200 bg-green-50",
  REJECTED: "text-red-600 border-red-200 bg-red-50",
  CANCELLED: "text-zinc-500 border-zinc-200 bg-zinc-50",
};

interface EmployeeDashboardProps {
  session: SessionPayload;
}

export async function EmployeeDashboard({ session }: EmployeeDashboardProps) {
  if (!session.employeeId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Employee profile not configured.</p>
      </div>
    );
  }

  const data = await getEmployeeDashboardData(session.employeeId);
  const totalLeave = data.leaveBalances.reduce((sum, b) => sum + b.remainingDays, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold">Good morning</h2>
        <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
      </div>

      {/* Attendance quick action */}
      <AttendanceCheckInOut
        employeeId={session.employeeId}
        initialAttendance={data.attendance ? {
          id: data.attendance.id,
          checkInTime: data.attendance.checkInTime?.toISOString() ?? null,
          checkOutTime: data.attendance.checkOutTime?.toISOString() ?? null,
          workingMinutes: data.attendance.workingMinutes,
        } : null}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Today's Status"
          value={
            data.attendance?.checkOutTime
              ? "Checked out"
              : data.attendance?.checkInTime
              ? "Checked in"
              : "Not checked in"
          }
          icon={CheckCircle2}
          description={
            data.attendance?.checkInTime
              ? `Since ${formatTime(data.attendance.checkInTime)}`
              : undefined
          }
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
          description="Today"
        />
        <StatCard
          label="Leave Balance"
          value={totalLeave}
          icon={CalendarOff}
          description="Days remaining"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My tasks */}
        <div className="rounded-lg border bg-card">
          <div className="px-5 py-3 border-b">
            <h3 className="text-sm font-medium">My Tasks</h3>
          </div>
          {data.myTasks.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No open tasks
            </div>
          ) : (
            <ul className="divide-y">
              {data.myTasks.map((task) => (
                <li key={task.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {task.status.toLowerCase().replace("_", " ")}
                      {task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ""}
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
              ))}
            </ul>
          )}
        </div>

        {/* Recent leave requests */}
        <div className="rounded-lg border bg-card">
          <div className="px-5 py-3 border-b">
            <h3 className="text-sm font-medium">Recent Leave Requests</h3>
          </div>
          {data.recentLeaves.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No leave requests
            </div>
          ) : (
            <ul className="divide-y">
              {data.recentLeaves.map((req) => (
                <li key={req.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{req.leaveType.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(req.startDate)} – {formatDate(req.endDate)} ({req.totalDays}d)
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${STATUS_COLORS[req.status] || ""}`}
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
