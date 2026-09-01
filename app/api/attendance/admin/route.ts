import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api";
import { RoleType } from "@prisma/client";
import { calcWorkingMinutes } from "@/lib/utils/date";

// POST /api/attendance/admin  — admin creates or updates any employee's attendance
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== RoleType.SUPER_ADMIN) return forbiddenResponse();

    const body = await request.json();
    const { employeeId, date, status, checkInTime, checkOutTime } = body;

    if (!employeeId || !date || !status) {
      return errorResponse("employeeId, date, and status are required");
    }

    const validStatuses = ["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"];
    if (!validStatuses.includes(status)) {
      return errorResponse("Invalid status");
    }

    // Parse the date to midnight UTC (same convention as getTodayDate)
    const attendanceDate = new Date(date + "T00:00:00.000Z");

    // Parse optional times
    let parsedCheckIn: Date | null = null;
    let parsedCheckOut: Date | null = null;

    if (checkInTime) {
      // checkInTime comes as "HH:mm" — combine with the date
      parsedCheckIn = new Date(`${date}T${checkInTime}:00.000Z`);
    }
    if (checkOutTime) {
      parsedCheckOut = new Date(`${date}T${checkOutTime}:00.000Z`);
    }

    // Calculate working minutes if both times are present
    let workingMinutes: number | null = null;
    if (parsedCheckIn && parsedCheckOut) {
      const gross = calcWorkingMinutes(parsedCheckIn, parsedCheckOut);
      workingMinutes = Math.max(0, gross);
    }

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: attendanceDate } },
      create: {
        employeeId,
        date: attendanceDate,
        status,
        checkInTime: parsedCheckIn,
        checkOutTime: parsedCheckOut,
        workingMinutes,
        teaBreakMinutes: 0,
        lunchBreakMinutes: 0,
      },
      update: {
        status,
        checkInTime: parsedCheckIn,
        checkOutTime: parsedCheckOut,
        workingMinutes,
      },
    });

    return successResponse(record);
  } catch (err) {
    return serverErrorResponse(err);
  }
}
