import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTask, updateTask } from "@/services/task.service";
import { updateTaskSchema } from "@/lib/validations/task";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    const { id } = await params;
    const task = await getTask(id);
    return successResponse(task);
  } catch (err) {
    if (err instanceof Error && err.message === "Task not found") return notFoundResponse("Task");
    return serverErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const task = await getTask(id);

    // Employees can only update status of their own tasks
    const canFullEdit =
      session.role !== "EMPLOYEE" ||
      task.assignedTo?.id === session.userId ||
      task.createdBy.id === session.userId;

    if (!canFullEdit) {
      if (parsed.data.title || parsed.data.priority || parsed.data.assignedToId) {
        return errorResponse("Employees can only update task status", 403);
      }
    }

    const updated = await updateTask(id, parsed.data);
    return successResponse(updated);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
