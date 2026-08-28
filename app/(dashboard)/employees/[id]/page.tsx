import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { getEmployee } from "@/services/employee.service";
import { prisma } from "@/lib/prisma";
import { EmployeeDetailPage } from "@/components/employees/employee-detail-page";

export const metadata: Metadata = { title: "Employee Detail" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER]);
  const { id } = await params;

  try {
    const [employee, departments, designations] = await Promise.all([
      getEmployee(id),
      prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
      prisma.designation.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);

    return (
      <EmployeeDetailPage
        employee={{
          id: employee.id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.user.email,
          role: employee.user.role,
          phone: employee.phone ?? null,
          department: employee.department ? { id: employee.department.id, name: employee.department.name } : null,
          designation: employee.designation ? { id: employee.designation.id, name: employee.designation.name } : null,
          status: employee.status,
          joiningDate: employee.joiningDate.toISOString(),
        }}
        departments={departments}
        designations={designations}
      />
    );
  } catch {
    notFound();
  }
}
