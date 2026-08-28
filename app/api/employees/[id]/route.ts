import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageEmployees } from "@/lib/auth/guards";
import { getEmployee, updateEmployee, deactivateEmployee } from "@/services/employee.service";
import { updateEmployeeSchema } from "@/lib/validations/employee";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    const { id } = await params;

    if (!canManageEmployees(session.role) && session.employeeId !== id) {
      return forbiddenResponse();
    }

    const employee = await getEmployee(id);
    return successResponse(employee);
  } catch (err) {
    if (err instanceof Error && err.message === "Employee not found") return notFoundResponse("Employee");
    return serverErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!canManageEmployees(session.role)) return forbiddenResponse();

    const { id } = await params;
    const body = await request.json();
    const parsed = updateEmployeeSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const updated = await updateEmployee(id, parsed.data);
    return successResponse(updated);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!canManageEmployees(session.role)) return forbiddenResponse();

    const { id } = await params;
    await deactivateEmployee(id);
    return successResponse({ message: "Employee deactivated" });
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
