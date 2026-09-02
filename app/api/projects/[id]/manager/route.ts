import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse,
  notFoundResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { changeManagerSchema } from "@/lib/validations/project";
import { changeProjectManager } from "@/services/project.service";
import { prisma } from "@/lib/prisma";

// PATCH /api/projects/[id]/manager — admin only; records full history
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!isAdmin(session.role)) return forbiddenResponse();

    const { id } = await params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFoundResponse("Project");

    const body = await request.json();
    const parsed = changeManagerSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    // Verify the new manager exists as an employee
    const newManager = await prisma.employee.findUnique({ where: { id: parsed.data.managerId } });
    if (!newManager) return errorResponse("Manager not found");

    const updated = await changeProjectManager(id, session.userId, parsed.data);
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// GET /api/projects/[id]/manager — returns full manager history
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const history = await prisma.projectManagerHistory.findMany({
      where: { projectId: id },
      orderBy: { assignedAt: "desc" },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, profileImage: true, designation: { select: { name: true } } },
        },
        changedBy: {
          select: { id: true, employee: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    return successResponse(history);
  } catch (err) {
    return serverErrorResponse(err);
  }
}
