import { prisma } from "@/lib/prisma";
import { calcWorkingMinutes } from "@/lib/utils/date";
import { format } from "date-fns";

export async function getTodayAttendance(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
}

export async function checkIn(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (existing) {
    if (existing.checkInTime) throw new Error("Already checked in for today");
  }

  return prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date: today } },
    create: {
      employeeId,
      date: today,
      checkInTime: new Date(),
      status: "PRESENT",
    },
    update: {
      checkInTime: new Date(),
      status: "PRESENT",
    },
  });
}

export async function checkOut(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (!attendance || !attendance.checkInTime) {
    throw new Error("No check-in found for today");
  }
  if (attendance.checkOutTime) {
    throw new Error("Already checked out for today");
  }

  const checkOutTime = new Date();
  const workingMinutes = calcWorkingMinutes(attendance.checkInTime, checkOutTime);

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutTime,
      workingMinutes,
    },
  });
}

export async function getAttendanceHistory(
  employeeId: string,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = options;

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendance.count({ where: { employeeId } }),
  ]);

  return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAttendanceSummary(date?: Date) {
  const targetDate = date || new Date();
  targetDate.setHours(0, 0, 0, 0);

  const [presentCount, totalActive] = await Promise.all([
    prisma.attendance.count({
      where: {
        date: targetDate,
        status: { in: ["PRESENT", "HALF_DAY"] },
      },
    }),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
  ]);

  return { present: presentCount, total: totalActive, date: format(targetDate, "yyyy-MM-dd") };
}

export async function getAllAttendanceForDate(date: Date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return prisma.attendance.findMany({
    where: { date: targetDate },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { checkInTime: "asc" },
  });
}
