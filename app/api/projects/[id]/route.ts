import { getSession } from "@/lib/auth/session";
import { isAdmin, canManageTasks } from "@/lib/auth/guards";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse,
  notFoundResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { updateProjectSchema } from "@/lib/validations/project";
import { getProject, updateProject } from "@/services/project.service";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const project = await getProject(id);
    if (!project) return notFoundResponse("Project");

    // Employees can only view projects they're a member of
    if (session.role === "EMPLOYEE" && session.employeeId) {
      const isMember = project.members.some((m) => m.employee.id === session.employeeId);
      if (!isMember) return forbiddenResponse();
    }

    return successResponse(project);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFoundResponse("Project");

    const canEdit =
      isAdmin(session.role) ||
      (session.role === "MANAGER" && project.managerId === session.employeeId);
    if (!canEdit) return forbiddenResponse();

    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const updated = await updateProject(id, parsed.data);
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!isAdmin(session.role)) return forbiddenResponse();

    const { id } = await params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFoundResponse("Project");

    await prisma.project.delete({ where: { id } });
    return successResponse({ id });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
