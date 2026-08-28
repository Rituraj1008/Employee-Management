import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { listDepartments } from "@/services/department.service";
import { DepartmentsListPage } from "@/components/departments/departments-list-page";

export const metadata: Metadata = { title: "Departments" };

export default async function Page() {
  await requireRole([RoleType.SUPER_ADMIN, RoleType.HR]);
  const departments = await listDepartments();

  return (
    <DepartmentsListPage
      departments={departments.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        manager: d.manager ? { firstName: d.manager.firstName, lastName: d.manager.lastName } : null,
        isActive: d.isActive,
        employeeCount: d._count.employees,
        createdAt: d.createdAt.toISOString(),
      }))}
    />
  );
}
