import { prisma } from "@/lib/prisma";
import { EmployeeStatus, Prisma } from "@prisma/client";

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: EmployeeStatus;
  page?: number;
  limit?: number;
}

const employeeSelect = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  phone: true,
  joiningDate: true,
  status: true,
  profileImage: true,
  createdAt: true,
  user: { select: { id: true, email: true, role: true } },
  department: { select: { id: true, name: true } },
  designation: { select: { id: true, name: true } },
} satisfies Prisma.EmployeeSelect;

export type EmployeeRow = Prisma.EmployeeGetPayload<{ select: typeof employeeSelect }>;

export async function findEmployees(filters: EmployeeFilters) {
  const { search, departmentId, status, page = 1, limit = 20 } = filters;

  const where: Prisma.EmployeeWhereInput = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { employeeCode: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (departmentId) where.departmentId = departmentId;
  if (status) where.status = status;

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      select: employeeSelect,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function findEmployeeById(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    select: employeeSelect,
  });
}

export async function findEmployeeByUserId(userId: string) {
  return prisma.employee.findUnique({
    where: { userId },
    select: employeeSelect,
  });
}
