import { getSession } from "@/lib/auth/session";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { createWorkNoteSchema } from "@/lib/validations/project";
import { listWorkNotes, createWorkNote } from "@/services/project.service";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const notes = await listWorkNotes(id);
    return successResponse(notes);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!session.employeeId) return forbiddenResponse();

    const { id } = await params;

    // Only project members can add work notes
    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_employeeId: { projectId: id, employeeId: session.employeeId } },
    });
    const isManager = await prisma.project.findFirst({
      where: { id, managerId: session.employeeId },
    });
    if (!isMember && !isManager) return forbiddenResponse();

    const body = await request.json();
    const parsed = createWorkNoteSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const note = await createWorkNote(id, session.employeeId, parsed.data);
    return successResponse(note, 201);
  } catch (err) {
    return serverErrorResponse(err);
  }
}
