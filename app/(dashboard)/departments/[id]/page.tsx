import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { getDepartment } from "@/services/department.service";
import { prisma } from "@/lib/prisma";
import { DepartmentDetailPage } from "@/components/departments/department-detail-page";

export const metadata: Metadata = { title: "Department" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([RoleType.SUPER_ADMIN, RoleType.HR]);
  const { id } = await params;

  try {
    const [department, activeEmployees] = await Promise.all([
      getDepartment(id),
      prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
    ]);

    return (
      <DepartmentDetailPage
        department={{
          id: department.id,
          name: department.name,
          description: department.description,
          manager: department.manager
            ? { id: department.manager.id, firstName: department.manager.firstName, lastName: department.manager.lastName }
            : null,
          isActive: department.isActive,
          employees: department.employees.map((e) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            email: e.user.email,
            role: e.user.role,
            designation: e.designation?.name ?? null,
          })),
        }}
        allEmployees={activeEmployees}
      />
    );
  } catch {
    notFound();
  }
}
