import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkIn } from "@/services/attendance.service";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.employeeId) return unauthorizedResponse();

    const record = await checkIn(session.employeeId);
    return successResponse(record);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
