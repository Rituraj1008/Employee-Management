import { z } from "zod";
import { RoleType, EmployeeStatus } from "@prisma/client";

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  joiningDate: z.string().min(1, "Joining date is required"),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  role: z.nativeEnum(RoleType).default(RoleType.EMPLOYEE),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  joiningDate: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  role: z.nativeEnum(RoleType).optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
