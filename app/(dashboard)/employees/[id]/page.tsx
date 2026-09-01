import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { getEmployee } from "@/services/employee.service";
import { prisma } from "@/lib/prisma";
import { EmployeeDetailPage } from "@/components/employees/employee-detail-page";
import { getCurrentYear } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Employee Detail" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER]);
  const { id } = await params;

  try {
    // Fetch last 400 days of attendance so week/month/year views all have data
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 400);
    cutoff.setHours(0, 0, 0, 0);

    const [employee, departments, designations, attendanceRecords, leaveRequests, leaveBalances] =
      await Promise.all([
        getEmployee(id),
        prisma.department.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.designation.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.attendance.findMany({
          where: { employeeId: id, date: { gte: cutoff } },
          orderBy: { date: "asc" },
          select: {
            date: true,
            checkInTime: true,
            checkOutTime: true,
            workingMinutes: true,
            status: true,
          },
        }),
        prisma.leaveRequest.findMany({
          where: { employeeId: id },
          include: { leaveType: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.leaveBalance.findMany({
          where: { employeeId: id, year: getCurrentYear() },
          include: { leaveType: { select: { name: true } } },
          orderBy: { leaveType: { name: "asc" } },
        }),
      ]);

    return (
      <EmployeeDetailPage
        employee={{
          id: employee.id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.user.email,
          role: employee.user.role,
          phone: employee.phone ?? null,
          department: employee.department
            ? { id: employee.department.id, name: employee.department.name }
            : null,
          designation: employee.designation
            ? { id: employee.designation.id, name: employee.designation.name }
            : null,
          status: employee.status,
          joiningDate: employee.joiningDate.toISOString(),
        }}
        departments={departments}
        designations={designations}
        attendanceRecords={attendanceRecords.map((r) => ({
          // Slice UTC ISO string — gives correct date for UTC+ timezones (incl. IST)
          date: r.date.toISOString().slice(0, 10),
          checkInTime: r.checkInTime?.toISOString() ?? null,
          checkOutTime: r.checkOutTime?.toISOString() ?? null,
          workingMinutes: r.workingMinutes,
          status: r.status,
        }))}
        leaveRequests={leaveRequests.map((r) => ({
          id: r.id,
          leaveType: r.leaveType.name,
          startDate: r.startDate.toISOString().slice(0, 10),
          endDate: r.endDate.toISOString().slice(0, 10),
          totalDays: r.totalDays,
          reason: r.reason,
          status: r.status,
          reviewNote: r.reviewNote,
          createdAt: r.createdAt.toISOString(),
        }))}
        leaveBalances={leaveBalances.map((b) => ({
          leaveTypeName: b.leaveType.name,
          totalDays: b.totalDays,
          usedDays: b.usedDays,
          remainingDays: b.remainingDays,
        }))}
      />
    );
  } catch {
    notFound();
  }
}
