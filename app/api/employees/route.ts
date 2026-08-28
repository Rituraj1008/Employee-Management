import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageEmployees } from "@/lib/auth/guards";
import { createEmployee } from "@/services/employee.service";
import { createEmployeeSchema } from "@/lib/validations/employee";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!canManageEmployees(session.role)) return forbiddenResponse();

    const body = await request.json();
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const employee = await createEmployee(parsed.data);
    return successResponse(employee, 201);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
