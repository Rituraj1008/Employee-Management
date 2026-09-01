import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SalaryPage } from "@/components/salary/salary-page";
import { MySalaryPage } from "@/components/salary/my-salary-page";

export const metadata: Metadata = { title: "Salary" };

export default async function Page() {
  const session = await requireAuth();

  /* ── Non-admin: show own salary view ── */
  if (session.role !== RoleType.SUPER_ADMIN) {
    if (!session.employeeId) redirect("/dashboard");

    const employee = await prisma.employee.findUnique({
      where: { id: session.employeeId },
      select: {
        employeeCode: true,
        firstName: true,
        lastName: true,
        user: { select: { role: true } },
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    if (!employee) redirect("/dashboard");

    return (
      <MySalaryPage
        employeeName={`${employee.firstName} ${employee.lastName}`}
        employeeCode={employee.employeeCode}
        role={employee.user.role}
        department={employee.department?.name ?? null}
        designation={employee.designation?.name ?? null}
      />
    );
  }

  /* ── Admin: full salary management ── */
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

  const totalPayroll = employees.reduce(
    (sum, e) => sum + (e.salary ? Number(e.salary.baseSalary) : 0),
    0
  );
  const salarySetCount = employees.filter((e) => e.salary !== null).length;

  return (
    <SalaryPage
      employees={employees.map((e) => ({
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
      }))}
      stats={{ total: employees.length, salarySet: salarySetCount, totalPayroll }}
    />
  );
}
