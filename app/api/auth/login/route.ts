import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { loginUser } from "@/services/auth.service";
import { setSessionCookie } from "@/lib/auth/session";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { token, user } = await loginUser(parsed.data);
    await setSessionCookie(token);
    return successResponse({ user });
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid email or password") {
      return errorResponse("Invalid email or password", 401);
    }
    return serverErrorResponse(err);
  }
}
