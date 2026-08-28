import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";
import { listDepartments, createDepartment } from "@/services/department.service";
import { createDepartmentSchema } from "@/lib/validations/department";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    const departments = await listDepartments(true);
    return successResponse(departments);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!isAdmin(session.role)) return forbiddenResponse();

    const body = await request.json();
    const parsed = createDepartmentSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const dept = await createDepartment(parsed.data);
    return successResponse(dept, 201);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
