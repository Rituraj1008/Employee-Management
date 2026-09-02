import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse,
  notFoundResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!isAdmin(session.role)) return forbiddenResponse();

    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!employee) return notFoundResponse("Employee");

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

    await prisma.user.update({
      where: { id: employee.userId },
      data: { passwordHash },
    });

    return successResponse({ message: "Password reset successfully" });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
