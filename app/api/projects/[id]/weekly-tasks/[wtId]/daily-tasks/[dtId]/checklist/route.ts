import { getSession } from "@/lib/auth/session";
import { canManageTasks } from "@/lib/auth/guards";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { createChecklistItemSchema } from "@/lib/validations/project";
import { listChecklistItems, addChecklistItem } from "@/services/daily-task.service";
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
    const items = await listChecklistItems(dtId);
    return successResponse(items);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ dtId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { dtId } = await params;
    const assignedTo = await resolveWeeklyOwner(dtId);
    const canAdd = canManageTasks(session.role) || assignedTo === session.employeeId;
    if (!canAdd) return forbiddenResponse();

    const body = await request.json();
    const parsed = createChecklistItemSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const item = await addChecklistItem(dtId, parsed.data);
    return successResponse(item, 201);
  } catch (err) {
    return serverErrorResponse(err);
  }
}
