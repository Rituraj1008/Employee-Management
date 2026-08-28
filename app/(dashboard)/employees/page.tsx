import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { listEmployees } from "@/services/employee.service";
import { prisma } from "@/lib/prisma";
import { EmployeesListPage } from "@/components/employees/employees-list-page";

export const metadata: Metadata = { title: "Employees" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; department?: string; status?: string; page?: string }>;
}) {
  await requireRole([RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER]);
  const params = await searchParams;

  const [data, departments] = await Promise.all([
    listEmployees({
      search: params.search,
      departmentId: params.department,
      status: params.status as "ACTIVE" | "INACTIVE" | undefined,
      page: parseInt(params.page || "1", 10),
      limit: 20,
    }),
    prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <EmployeesListPage
      employees={data.employees.map((e) => ({
        id: e.id,
        employeeCode: e.employeeCode,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.user.email,
        role: e.user.role,
        department: e.department?.name ?? null,
        designation: e.designation?.name ?? null,
        status: e.status,
        joiningDate: e.joiningDate.toISOString(),
      }))}
      total={data.total}
      page={data.page}
      totalPages={data.totalPages}
      departments={departments}
    />
  );
}
