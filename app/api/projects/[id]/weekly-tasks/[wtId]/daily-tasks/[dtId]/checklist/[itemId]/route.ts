import { getSession } from "@/lib/auth/session";
import { canManageTasks } from "@/lib/auth/guards";
import {
  successResponse, unauthorizedResponse, forbiddenResponse,
  notFoundResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { toggleChecklistItem, deleteChecklistItem } from "@/services/daily-task.service";
import { prisma } from "@/lib/prisma";

async function resolveOwner(itemId: string) {
  const item = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    include: { dailyTask: { include: { weeklyTask: true } } },
  });
  return item?.dailyTask.weeklyTask.assignedToId ?? null;
}

// PATCH — toggle completed
export async function PATCH(_req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { itemId } = await params;
    const assignedTo = await resolveOwner(itemId);
    if (!assignedTo) return notFoundResponse("Checklist item");

    const canToggle = canManageTasks(session.role) || assignedTo === session.employeeId;
    if (!canToggle) return forbiddenResponse();

    const item = await toggleChecklistItem(itemId);
    return successResponse(item);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { itemId } = await params;
    const assignedTo = await resolveOwner(itemId);
    if (!assignedTo) return notFoundResponse("Checklist item");

    const canDelete = canManageTasks(session.role) || assignedTo === session.employeeId;
    if (!canDelete) return forbiddenResponse();

    await deleteChecklistItem(itemId);
    return successResponse({ id: itemId });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
