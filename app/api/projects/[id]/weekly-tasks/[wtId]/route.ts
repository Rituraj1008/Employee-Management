import { getSession } from "@/lib/auth/session";
import { canManageTasks } from "@/lib/auth/guards";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse,
  notFoundResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { updateWeeklyTaskSchema } from "@/lib/validations/project";
import { getWeeklyTask, updateWeeklyTask, deleteWeeklyTask } from "@/services/weekly-task.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; wtId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { wtId } = await params;
    const task = await getWeeklyTask(wtId);
    if (!task) return notFoundResponse("Weekly task");

    if (session.role === "EMPLOYEE" && task.assignedToId !== session.employeeId) {
      return forbiddenResponse();
    }

    return successResponse(task);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; wtId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { wtId } = await params;
    const task = await getWeeklyTask(wtId);
    if (!task) return notFoundResponse("Weekly task");

    const canEdit =
      canManageTasks(session.role) || task.assignedToId === session.employeeId;
    if (!canEdit) return forbiddenResponse();

    const body = await request.json();
    const parsed = updateWeeklyTaskSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const updated = await updateWeeklyTask(wtId, parsed.data);
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; wtId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!canManageTasks(session.role)) return forbiddenResponse();

    const { wtId } = await params;
    await deleteWeeklyTask(wtId);
    return successResponse({ id: wtId });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
