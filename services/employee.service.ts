import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/lib/validations/employee";
import { EmployeeFilters, findEmployees, findEmployeeById } from "@/repositories/employee.repository";

export async function listEmployees(filters: EmployeeFilters) {
  return findEmployees(filters);
}

export async function getEmployee(id: string) {
  const employee = await findEmployeeById(id);
  if (!employee) throw new Error("Employee not found");
  return employee;
}

export async function createEmployee(input: CreateEmployeeInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) throw new Error("Email already in use");

  const count = await prisma.employee.count();
  const employeeCode = `EMP${String(count + 1).padStart(4, "0")}`;
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role,
      employee: {
        create: {
          employeeCode,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          joiningDate: new Date(input.joiningDate),
          departmentId: input.departmentId || null,
          designationId: input.designationId || null,
          status: input.status,
        },
      },
    },
    include: { employee: true },
  });

  return user.employee!;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const employee = await findEmployeeById(id);
  if (!employee) throw new Error("Employee not found");

  const updateData: Parameters<typeof prisma.employee.update>[0]["data"] = {};
  if (input.firstName !== undefined) updateData.firstName = input.firstName;
  if (input.lastName !== undefined) updateData.lastName = input.lastName;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.joiningDate !== undefined) updateData.joiningDate = new Date(input.joiningDate);
  if (input.departmentId !== undefined) updateData.department = { connect: { id: input.departmentId } };
  if (input.designationId !== undefined) updateData.designation = { connect: { id: input.designationId } };
  if (input.status !== undefined) updateData.status = input.status;
  if (input.role !== undefined) updateData.user = { update: { role: input.role } };

  const updated = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, email: true, role: true } },
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, name: true } },
    },
  });

  return updated;
}

export async function deactivateEmployee(id: string) {
  return prisma.employee.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
}
