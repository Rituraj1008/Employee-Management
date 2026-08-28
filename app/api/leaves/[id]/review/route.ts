import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canApproveLeave } from "@/lib/auth/guards";
import { reviewLeaveRequest } from "@/services/leave.service";
import { reviewLeaveSchema } from "@/lib/validations/leave";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!canApproveLeave(session.role)) return forbiddenResponse();

    const { id } = await params;
    const body = await request.json();
    const parsed = reviewLeaveSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const result = await reviewLeaveRequest(id, session.userId, parsed.data);
    return successResponse(result);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
