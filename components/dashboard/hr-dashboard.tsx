import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { StatCard } from "./stat-card";
import { Users, UserCheck, CalendarOff, Clock, ArrowRight, UserPlus, Building2 } from "lucide-react";
import { formatDate, getTodayDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

async function getHRDashboardData() {
  const today = getTodayDate();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    presentToday,
    pendingLeaves,
    departments,
    recentEmployees,
    pendingLeaveRequests,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.employee.count({ where: { status: "INACTIVE" } }),
    prisma.attendance.count({
      where: { date: today, status: { in: ["PRESENT", "HALF_DAY"] } },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { employees: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
      orderBy: { name: "asc" },
      take: 5,
    }),
    prisma.employee.findMany({
      where: { joiningDate: { gte: thirtyDaysAgo } },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        user: { select: { role: true } },
      },
      orderBy: { joiningDate: "desc" },
      take: 5,
    }),
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    presentToday,
    pendingLeaves,
    departments,
    recentEmployees,
    pendingLeaveRequests,
  };
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  APPROVED: "text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  REJECTED: "text-red-700 border-red-200 bg-red-50 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
};

interface HRDashboardProps {
  session: SessionPayload;
}

export async function HRDashboard({ session: _ }: HRDashboardProps) {
  const data = await getHRDashboardData();
  const attendancePct =
    data.activeEmployees > 0
      ? Math.round((data.presentToday / data.activeEmployees) * 100)
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">HR Overview</h2>
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
            Pending approvals
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={data.totalEmployees}
          icon={Users}
          description={`${data.activeEmployees} active`}
          accent="blue"
        />
        <StatCard
          label="Present Today"
          value={data.presentToday}
          icon={UserCheck}
          description={`${attendancePct}% attendance`}
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
          label="Inactive"
          value={data.inactiveEmployees}
          icon={Clock}
          description="Employees on hold"
          accent="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent joiners */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Recent Joiners</h3>
            </div>
            <Link
              href="/employees"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              All employees <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {data.recentEmployees.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground">No new employees in the last 30 days</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentEmployees.map((emp) => (
                <li key={emp.id}>
                  <Link
                    href={`/employees/${emp.id}`}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {emp.designation?.name || "—"}
                        {emp.department ? ` · ${emp.department.name}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(emp.joiningDate)}
                    </span>
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
              Manage <ArrowRight className="h-3 w-3" />
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
                        {req.leaveType.name} · {req.totalDays} day{req.totalDays !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs shrink-0", STATUS_BADGE.PENDING)}
                  >
                    Pending
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Departments */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Departments</h3>
          </div>
          <Link
            href="/departments"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {data.departments.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">No departments yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.departments.map((dept) => {
              const pct = data.totalEmployees > 0
                ? Math.round((dept._count.employees / data.totalEmployees) * 100)
                : 0;
              return (
                <Link
                  key={dept.id}
                  href={`/departments/${dept.id}`}
                  className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {dept.manager
                          ? `${dept.manager.firstName} ${dept.manager.lastName}`
                          : "No manager"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 hidden sm:block">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {dept._count.employees} people
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
