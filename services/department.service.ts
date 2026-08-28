import { prisma } from "@/lib/prisma";
import { CreateDepartmentInput, UpdateDepartmentInput } from "@/lib/validations/department";

export async function listDepartments(activeOnly = false) {
  return prisma.department.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: { select: { employees: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getDepartment(id: string) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true } },
      employees: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          user: { select: { email: true, role: true } },
          designation: { select: { name: true } },
        },
      },
    },
  });
  if (!dept) throw new Error("Department not found");
  return dept;
}

export async function createDepartment(input: CreateDepartmentInput) {
  const existing = await prisma.department.findUnique({ where: { name: input.name } });
  if (existing) throw new Error("Department name already exists");

  return prisma.department.create({
    data: {
      name: input.name,
      description: input.description,
      managerId: input.managerId || null,
    },
  });
}

export async function updateDepartment(id: string, input: UpdateDepartmentInput) {
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) throw new Error("Department not found");

  if (input.name && input.name !== dept.name) {
    const existing = await prisma.department.findUnique({ where: { name: input.name } });
    if (existing) throw new Error("Department name already exists");
  }

  return prisma.department.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      managerId: input.managerId,
      isActive: input.isActive,
    },
  });
}
