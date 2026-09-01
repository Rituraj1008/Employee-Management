import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { RoleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== RoleType.SUPER_ADMIN) return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") ?? "0");
    const year = parseInt(searchParams.get("year") ?? "0");

    if (!month || !year || month < 1 || month > 12) {
      return errorResponse("Valid month and year are required");
    }

    const slips = await prisma.salarySlip.findMany({
      where: { month, year },
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
      orderBy: [{ employee: { user: { role: "asc" } } }, { employee: { firstName: "asc" } }],
    });

    return successResponse(
      slips.map((s) => ({
        id: s.id,
        month: s.month,
        year: s.year,
        baseSalary: Number(s.baseSalary),
        workingDays: s.workingDays,
        presentDays: s.presentDays,
        halfDays: s.halfDays,
        absentDays: s.absentDays,
        paidLeaveDays: s.paidLeaveDays,
        unpaidLeaveDays: s.unpaidLeaveDays,
        deductions: Number(s.deductions),
        netSalary: Number(s.netSalary),
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
        employee: {
          id: s.employee.id,
          employeeCode: s.employee.employeeCode,
          firstName: s.employee.firstName,
          lastName: s.employee.lastName,
          role: s.employee.user.role,
          department: s.employee.department?.name ?? null,
          designation: s.employee.designation?.name ?? null,
        },
      }))
    );
  } catch (err) {
    return serverErrorResponse(err);
  }
}
