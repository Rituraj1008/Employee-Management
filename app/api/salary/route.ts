import { getSession } from "@/lib/auth/session";
import { RoleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== RoleType.SUPER_ADMIN) return forbiddenResponse();

    const employees = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        user: { role: { not: RoleType.SUPER_ADMIN } },
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        joiningDate: true,
        user: { select: { role: true, email: true } },
        department: { select: { name: true } },
        designation: { select: { name: true } },
        salary: {
          select: {
            id: true,
            baseSalary: true,
            effectiveFrom: true,
          },
        },
      },
      orderBy: [{ user: { role: "asc" } }, { firstName: "asc" }],
    });

    return successResponse(
      employees.map((e) => ({
        id: e.id,
        employeeCode: e.employeeCode,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.user.email,
        role: e.user.role,
        department: e.department?.name ?? null,
        designation: e.designation?.name ?? null,
        joiningDate: e.joiningDate.toISOString(),
        salary: e.salary
          ? {
              id: e.salary.id,
              baseSalary: Number(e.salary.baseSalary),
              effectiveFrom: e.salary.effectiveFrom.toISOString(),
            }
          : null,
      }))
    );
  } catch (err) {
    return serverErrorResponse(err);
  }
}
