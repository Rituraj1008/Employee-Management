import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { addTaskComment } from "@/services/task.service";
import { createTaskCommentSchema } from "@/lib/validations/task";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.employeeId) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const parsed = createTaskCommentSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const comment = await addTaskComment(id, session.employeeId, parsed.data);
    return successResponse(comment, 201);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
