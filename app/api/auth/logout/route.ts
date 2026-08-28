import { clearSessionCookie } from "@/lib/auth/session";
import { successResponse } from "@/lib/utils/api";

export async function POST() {
  await clearSessionCookie();
  return successResponse({ message: "Logged out" });
}
