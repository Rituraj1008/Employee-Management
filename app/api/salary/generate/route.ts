import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { RoleType, AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

/** Count Mon–Sat days in a given month (1-indexed). */
function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateFromParts(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function getMonthBounds(year: number, month: number) {
  const start = dateFromParts(year, month, 1);
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return { start, end };
}

function getWorkingDateKeys(year: number, month: number): string[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dates: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = dateFromParts(year, month, day);
    if (date.getUTCDay() !== 0) {
      dates.push(dateKey(date));
    }
  }

  return dates;
}

/** Build a Set of "YYYY-MM-DD" strings covered by approved leaves. */
function buildPaidLeaveDates(
  leaves: { startDate: Date; endDate: Date }[],
  year: number,
  month: number
): Set<string> {
  const { start: monthStart, end: monthEnd } = getMonthBounds(year, month);
  const dates = new Set<string>();

  for (const leave of leaves) {
    const start = new Date(Math.max(leave.startDate.getTime(), monthStart.getTime()));
    const end = new Date(Math.min(leave.endDate.getTime(), monthEnd.getTime()));
    const cur = new Date(start);

    while (cur <= end) {
      dates.add(dateKey(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  return dates;
}

// POST /api/salary/generate
// Body: { month: number, year: number, employeeId?: string }
// If employeeId omitted → generate for all employees that have a baseSalary set.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== RoleType.SUPER_ADMIN) return forbiddenResponse();

    const body = await req.json();
    const month = parseInt(body.month);
    const year = parseInt(body.year);

    if (!month || !year || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return errorResponse("Valid month (1–12) and year are required");
    }

    const { start: monthStart, end: monthEnd } = getMonthBounds(year, month);
    const workingDateKeys = getWorkingDateKeys(year, month);
    const workingDays = workingDateKeys.length;

    // Fetch employees with salary, filtered optionally by employeeId
    const salaries = await prisma.employeeSalary.findMany({
      where: {
        ...(body.employeeId ? { employeeId: body.employeeId } : {}),
        effectiveFrom: { lte: monthEnd },
        employee: {
          status: "ACTIVE",
          user: { role: { not: RoleType.SUPER_ADMIN } },
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            joiningDate: true,
            user: { select: { role: true } },
          },
        },
      },
    });

    if (salaries.length === 0) {
      return errorResponse("No eligible active employees with salary set found for this month");
    }

    const generatedSlips: object[] = [];

    for (const sal of salaries) {
      const empId = sal.employeeId;

      // Attendance for the month
      const attendance = await prisma.attendance.findMany({
        where: {
          employeeId: empId,
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { date: true, status: true },
      });

      // Approved leaves overlapping the month
      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: empId,
          status: "APPROVED",
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart },
        },
        select: { startDate: true, endDate: true },
      });

      const paidLeaveDates = buildPaidLeaveDates(approvedLeaves, year, month);
      const attendanceByDate = new Map(
        attendance.map((att) => [dateKey(att.date), att.status])
      );

      let presentDays = 0;
      let halfDays = 0;
      let absentDays = 0;
      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;

      for (const dayKey of workingDateKeys) {
        const status = attendanceByDate.get(dayKey);

        switch (status) {
          case AttendanceStatus.PRESENT:
            presentDays++;
            break;
          case AttendanceStatus.HALF_DAY:
            halfDays++;
            break;
          case AttendanceStatus.ABSENT:
            if (paidLeaveDates.has(dayKey)) {
              paidLeaveDays++;
            } else {
              absentDays++;
            }
            break;
          case AttendanceStatus.ON_LEAVE:
            if (paidLeaveDates.has(dayKey)) {
              paidLeaveDays++;
            } else {
              unpaidLeaveDays++;
            }
            break;
          default:
            if (paidLeaveDates.has(dayKey)) {
              paidLeaveDays++;
            } else {
              absentDays++;
            }
            break;
        }
      }

      const base = Number(sal.baseSalary);
      const dailyRate = workingDays > 0 ? base / workingDays : 0;
      const effectiveAbsent = absentDays + unpaidLeaveDays;
      const deductions = parseFloat(
        ((halfDays * 0.5 + effectiveAbsent) * dailyRate).toFixed(2)
      );
      const netSalary = parseFloat(Math.max(0, base - deductions).toFixed(2));

      const slip = await prisma.salarySlip.upsert({
        where: { employeeId_month_year: { employeeId: empId, month, year } },
        create: {
          employeeId: empId,
          month,
          year,
          baseSalary: base,
          workingDays,
          presentDays,
          halfDays,
          absentDays,
          paidLeaveDays,
          unpaidLeaveDays,
          deductions,
          netSalary,
          generatedById: session.userId,
        },
        update: {
          baseSalary: base,
          workingDays,
          presentDays,
          halfDays,
          absentDays,
          paidLeaveDays,
          unpaidLeaveDays,
          deductions,
          netSalary,
          generatedById: session.userId,
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              user: { select: { role: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
      });

      generatedSlips.push({
        id: slip.id,
        month: slip.month,
        year: slip.year,
        baseSalary: Number(slip.baseSalary),
        workingDays: slip.workingDays,
        presentDays: slip.presentDays,
        halfDays: slip.halfDays,
        absentDays: slip.absentDays,
        paidLeaveDays: slip.paidLeaveDays,
        unpaidLeaveDays: slip.unpaidLeaveDays,
        deductions: Number(slip.deductions),
        netSalary: Number(slip.netSalary),
        createdAt: slip.createdAt.toISOString(),
        employee: {
          id: slip.employee.id,
          employeeCode: slip.employee.employeeCode,
          firstName: slip.employee.firstName,
          lastName: slip.employee.lastName,
          role: slip.employee.user.role,
          department: slip.employee.department?.name ?? null,
          designation: slip.employee.designation?.name ?? null,
        },
      });
    }

    return successResponse({ count: generatedSlips.length, slips: generatedSlips });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
