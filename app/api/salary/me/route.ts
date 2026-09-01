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

// GET /api/salary/me — own salary info + slip for a given month/year
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role === RoleType.SUPER_ADMIN) return forbiddenResponse();
    if (!session.employeeId) return errorResponse("No employee record linked to this account");

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") ?? "0");
    const year = parseInt(searchParams.get("year") ?? "0");

    const salary = await prisma.employeeSalary.findUnique({
      where: { employeeId: session.employeeId },
      select: { baseSalary: true, effectiveFrom: true },
    });

    let slip = null;
    if (month && year && month >= 1 && month <= 12) {
      const raw = await prisma.salarySlip.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: session.employeeId,
            month,
            year,
          },
        },
      });

      if (raw) {
        slip = {
          id: raw.id,
          month: raw.month,
          year: raw.year,
          baseSalary: Number(raw.baseSalary),
          workingDays: raw.workingDays,
          presentDays: raw.presentDays,
          halfDays: raw.halfDays,
          absentDays: raw.absentDays,
          paidLeaveDays: raw.paidLeaveDays,
          unpaidLeaveDays: raw.unpaidLeaveDays,
          deductions: Number(raw.deductions),
          netSalary: Number(raw.netSalary),
          createdAt: raw.createdAt.toISOString(),
        };
      }
    }

    return successResponse({
      salary: salary
        ? {
            baseSalary: Number(salary.baseSalary),
            effectiveFrom: salary.effectiveFrom.toISOString(),
          }
        : null,
      slip,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
