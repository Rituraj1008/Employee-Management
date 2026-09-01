import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { getAttendanceHistory } from "@/services/attendance.service";
import { prisma } from "@/lib/prisma";
import { AttendancePage } from "@/components/attendance/attendance-page";
import { AdminAttendancePage } from "@/components/attendance/admin-attendance-page";
import { RoleType } from "@prisma/client";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Attendance" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; date?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;

  /* ── Admin view: monitor and update all employees ── */
  if (session.role === RoleType.SUPER_ADMIN) {
    // Resolve the date (default: today)
    const dateStr = params.date ?? format(new Date(), "yyyy-MM-dd");
    const attendanceDate = new Date(dateStr + "T00:00:00.000Z");

    // All active employees with their attendance for the selected date
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { role: true } },
        department: { select: { name: true } },
        designation: { select: { name: true } },
        attendance: {
          where: { date: attendanceDate },
          take: 1,
        },
      },
      orderBy: [{ department: { name: "asc" } }, { firstName: "asc" }],
    });

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const rows = employees.map((emp) => {
      const att = emp.attendance[0] ?? null;
      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.department?.name ?? null,
        designation: emp.designation?.name ?? null,
        attendance: att
          ? {
              id: att.id,
              checkInTime: att.checkInTime?.toISOString() ?? null,
              checkOutTime: att.checkOutTime?.toISOString() ?? null,
              workingMinutes: att.workingMinutes,
              teaBreakMinutes: att.teaBreakMinutes,
              lunchBreakMinutes: att.lunchBreakMinutes,
              status: att.status,
            }
          : null,
      };
    });

    return (
      <AdminAttendancePage
        rows={rows}
        date={dateStr}
        departments={departments}
      />
    );
  }

  /* ── Employee / HR / Manager view: own attendance ── */
  if (!session.employeeId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Employee profile not found.</p>
      </div>
    );
  }

  const page = parseInt(params.page || "1", 10);
  const data = await getAttendanceHistory(session.employeeId, { page, limit: 20 });

  return (
    <AttendancePage
      records={data.records.map((r) => ({
        id: r.id,
        date: r.date.toISOString(),
        checkInTime: r.checkInTime?.toISOString() ?? null,
        checkOutTime: r.checkOutTime?.toISOString() ?? null,
        workingMinutes: r.workingMinutes,
        teaBreakMinutes: r.teaBreakMinutes,
        lunchBreakMinutes: r.lunchBreakMinutes,
        status: r.status,
      }))}
      total={data.total}
      page={page}
      totalPages={data.totalPages}
      employeeId={session.employeeId}
    />
  );
}
