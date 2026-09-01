import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { logBreak } from "@/services/attendance.service";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.employeeId) return unauthorizedResponse();

    const body = await request.json();
    const { type, taken } = body as { type: "tea" | "lunch"; taken: boolean };

    if (type !== "tea" && type !== "lunch") return errorResponse("Invalid break type");

    const record = await logBreak(session.employeeId, type, taken);
    return successResponse(record);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
