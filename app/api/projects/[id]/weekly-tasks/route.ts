import { getSession } from "@/lib/auth/session";
import { canManageTasks } from "@/lib/auth/guards";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { createWeeklyTaskSchema } from "@/lib/validations/project";
import { listWeeklyTasks, createWeeklyTask } from "@/services/weekly-task.service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const filters = {
      assignedToId: searchParams.get("assignedToId") ?? undefined,
      weekNumber: searchParams.get("week") ? Number(searchParams.get("week")) : undefined,
      year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
    };

    // Employees see only their own weekly tasks
    if (session.role === "EMPLOYEE" && session.employeeId) {
      filters.assignedToId = session.employeeId;
    }

    const tasks = await listWeeklyTasks(id, filters);
    return successResponse(tasks);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!canManageTasks(session.role)) return forbiddenResponse();

    const { id } = await params;
    const body = await request.json();
    const parsed = createWeeklyTaskSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const task = await createWeeklyTask(id, parsed.data);
    return successResponse(task, 201);
  } catch (err) {
    return serverErrorResponse(err);
  }
}
