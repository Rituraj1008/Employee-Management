import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageTasks } from "@/lib/auth/guards";
import { createTask } from "@/services/task.service";
import { createTaskSchema } from "@/lib/validations/task";
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
    if (!canManageTasks(session.role)) return forbiddenResponse();

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const task = await createTask(session.userId, parsed.data);
    return successResponse(task, 201);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
