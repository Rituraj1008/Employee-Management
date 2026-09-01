import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canApproveLeave } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getCurrentYear } from "@/lib/utils/date";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!canApproveLeave(session.role)) return forbiddenResponse();

    const { employeeId } = await params;
    const year = getCurrentYear();

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        joiningDate: true,
        user: { select: { role: true, email: true } },
        department: { select: { name: true } },
        designation: { select: { name: true } },
        leaveBalances: {
          where: { year },
          include: { leaveType: { select: { name: true } } },
        },
      },
    });

    if (!employee) {
      return successResponse(null, 404);
    }

    return successResponse({
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.user.email,
      role: employee.user.role,
      department: employee.department?.name ?? null,
      designation: employee.designation?.name ?? null,
      joiningDate: employee.joiningDate.toISOString(),
      balances: employee.leaveBalances.map((b) => ({
        leaveTypeName: b.leaveType.name,
        totalDays: b.totalDays,
        usedDays: b.usedDays,
        remainingDays: b.remainingDays,
      })),
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
