import { getSession } from "@/lib/auth/session";
import { canManageTasks } from "@/lib/auth/guards";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { createDailyTaskSchema } from "@/lib/validations/project";
import { listDailyTasks, createDailyTask } from "@/services/daily-task.service";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ wtId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { wtId } = await params;
    const tasks = await listDailyTasks(wtId);
    return successResponse(tasks);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ wtId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { wtId } = await params;
    const weeklyTask = await prisma.weeklyTask.findUnique({ where: { id: wtId } });
    if (!weeklyTask) return successResponse([], 404);

    const canCreate =
      canManageTasks(session.role) || weeklyTask.assignedToId === session.employeeId;
    if (!canCreate) return forbiddenResponse();

    const body = await request.json();
    const parsed = createDailyTaskSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const task = await createDailyTask(wtId, parsed.data);
    return successResponse(task, 201);
  } catch (err) {
    return serverErrorResponse(err);
  }
}
