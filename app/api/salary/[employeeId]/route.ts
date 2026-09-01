import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { RoleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

function parseDateOnly(value: unknown): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const today = new Date();
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Effective from must be a valid date");
  }

  return date;
}

// POST /api/salary/[employeeId] — set or update base salary (upsert)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== RoleType.SUPER_ADMIN) return forbiddenResponse();

    const { employeeId } = await params;
    const body = await req.json();
    const baseSalary = Number(body.baseSalary);

    if (!baseSalary || isNaN(baseSalary) || baseSalary <= 0) {
      return errorResponse("Base salary must be a positive number");
    }
    if (baseSalary > 9999999) {
      return errorResponse("Salary value too large");
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        status: "ACTIVE",
        user: { role: { not: RoleType.SUPER_ADMIN } },
      },
    });
    if (!employee) return notFoundResponse("Employee");

    let effectiveFrom: Date;
    try {
      effectiveFrom = parseDateOnly(body.effectiveFrom);
    } catch (err) {
      return errorResponse(err instanceof Error ? err.message : "Invalid effective from date");
    }

    const salary = await prisma.employeeSalary.upsert({
      where: { employeeId },
      create: {
        employeeId,
        baseSalary,
        effectiveFrom,
      },
      update: {
        baseSalary,
        effectiveFrom,
      },
    });

    return successResponse({
      id: salary.id,
      baseSalary: Number(salary.baseSalary),
      effectiveFrom: salary.effectiveFrom.toISOString(),
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
