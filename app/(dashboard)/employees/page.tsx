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
  searchParams: Promise<{ search?: string; department?: string; status?: string; role?: string; page?: string }>;
}) {
  const session = await requireRole([RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER]);
  const params = await searchParams;

  const isAdmin = session.role === RoleType.SUPER_ADMIN || session.role === RoleType.HR;

  const [data, departments] = await Promise.all([
    listEmployees({
      search: params.search,
      departmentId: params.department,
      status: params.status as "ACTIVE" | "INACTIVE" | undefined,
      role: isAdmin ? (params.role as RoleType | undefined) : undefined,
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
      isAdmin={isAdmin}
    />
  );
}
