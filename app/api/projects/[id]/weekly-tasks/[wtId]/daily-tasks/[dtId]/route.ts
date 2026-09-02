import { getSession } from "@/lib/auth/session";
import { canManageTasks } from "@/lib/auth/guards";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse,
  notFoundResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { updateDailyTaskSchema } from "@/lib/validations/project";
import { getDailyTask, updateDailyTask, deleteDailyTask } from "@/services/daily-task.service";
import { prisma } from "@/lib/prisma";

async function resolveWeeklyOwner(dailyTaskId: string) {
  const dt = await prisma.dailyTask.findUnique({
    where: { id: dailyTaskId },
    include: { weeklyTask: true },
  });
  return dt?.weeklyTask.assignedToId ?? null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ dtId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { dtId } = await params;
    const task = await getDailyTask(dtId);
    if (!task) return notFoundResponse("Daily task");
    return successResponse(task);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ dtId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { dtId } = await params;
    const assignedTo = await resolveWeeklyOwner(dtId);
    const canEdit = canManageTasks(session.role) || assignedTo === session.employeeId;
    if (!canEdit) return forbiddenResponse();

    const body = await request.json();
    const parsed = updateDailyTaskSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const updated = await updateDailyTask(dtId, parsed.data);
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ dtId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { dtId } = await params;
    const assignedTo = await resolveWeeklyOwner(dtId);
    const canDelete = canManageTasks(session.role) || assignedTo === session.employeeId;
    if (!canDelete) return forbiddenResponse();

    await deleteDailyTask(dtId);
    return successResponse({ id: dtId });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
