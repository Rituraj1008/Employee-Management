import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse,
  notFoundResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { z } from "zod";
import { RoleType } from "@prisma/client";
import { addProjectMember, removeProjectMember } from "@/services/project.service";
import { prisma } from "@/lib/prisma";

const addMemberSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.enum(["LEAD", "MEMBER"]).default("MEMBER"),
});

const removeMemberSchema = z.object({
  employeeId: z.string().uuid(),
});

async function canManageMembers(session: { role: RoleType; employeeId?: string }, projectId: string) {
  if (isAdmin(session.role)) return true;
  if (session.role === "MANAGER") {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    return project?.managerId === session.employeeId;
  }
  return false;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    if (!(await canManageMembers(session, id))) return forbiddenResponse();

    const body = await request.json();
    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const employee = await prisma.employee.findUnique({ where: { id: parsed.data.employeeId } });
    if (!employee) return notFoundResponse("Employee");

    const member = await addProjectMember(id, parsed.data.employeeId, parsed.data.role);
    return successResponse(member, 201);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    if (!(await canManageMembers(session, id))) return forbiddenResponse();

    const body = await request.json();
    const parsed = removeMemberSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    await removeProjectMember(id, parsed.data.employeeId);
    return successResponse({ removed: parsed.data.employeeId });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
