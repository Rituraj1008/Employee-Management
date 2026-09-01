import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { CreateLeaveRequestInput, ReviewLeaveInput } from "@/lib/validations/leave";
import { getDatesBetween, getCurrentYear } from "@/lib/utils/date";

export async function listLeaveTypes() {
  return prisma.leaveType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getLeaveBalance(employeeId: string) {
  const year = getCurrentYear();
  return prisma.leaveBalance.findMany({
    where: { employeeId, year },
    include: { leaveType: { select: { id: true, name: true } } },
  });
}

export async function createLeaveRequest(employeeId: string, input: CreateLeaveRequestInput) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (endDate < startDate) throw new Error("End date must be after start date");
  if (startDate < new Date(new Date().setHours(0, 0, 0, 0))) {
    throw new Error("Cannot apply for past dates");
  }

  // Check for overlapping approved/pending requests
  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      status: { in: ["PENDING", "APPROVED"] },
      OR: [
        { startDate: { lte: endDate }, endDate: { gte: startDate } },
      ],
    },
  });
  if (overlap) throw new Error("You already have a leave request for overlapping dates");

  const totalDays = getDatesBetween(startDate, endDate);
  const year = startDate.getFullYear();

  // Check balance
  const balance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId: input.leaveTypeId,
        year,
      },
    },
  });

  if (!balance || balance.remainingDays < totalDays) {
    throw new Error("Insufficient leave balance");
  }

  return prisma.leaveRequest.create({
    data: {
      employeeId,
      leaveTypeId: input.leaveTypeId,
      startDate,
      endDate,
      totalDays,
      reason: input.reason,
      status: "PENDING",
    },
    include: {
      leaveType: { select: { id: true, name: true } },
    },
  });
}

export async function reviewLeaveRequest(
  requestId: string,
  reviewerId: string,
  input: ReviewLeaveInput
) {
  const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Leave request not found");
  if (request.status !== "PENDING") throw new Error("Request is already resolved");

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: input.status as LeaveStatus,
        reviewedBy: reviewerId,
        reviewNote: input.reviewNote,
        reviewedAt: new Date(),
      },
    });

    if (input.status === "APPROVED") {
      const year = request.startDate.getFullYear();
      await tx.leaveBalance.update({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year,
          },
        },
        data: {
          usedDays: { increment: request.totalDays },
          remainingDays: { decrement: request.totalDays },
        },
      });
    }

    return result;
  });

  return updated;
}

export async function cancelLeaveRequest(requestId: string, employeeId: string) {
  const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Leave request not found");
  if (request.employeeId !== employeeId) throw new Error("Forbidden");
  if (request.status !== "PENDING") throw new Error("Only pending requests can be cancelled");

  return prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });
}

export async function listLeaveRequests(options: {
  employeeId?: string;
  excludeRoles?: import("@prisma/client").RoleType[];
  status?: LeaveStatus;
  page?: number;
  limit?: number;
}) {
  const { employeeId, excludeRoles, status, page = 1, limit = 20 } = options;

  const where: import("@prisma/client").Prisma.LeaveRequestWhereInput = {};
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  if (excludeRoles?.length) {
    where.employee = { user: { role: { notIn: excludeRoles } } };
  }

  const [requests, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { role: true } },
          },
        },
        leaveType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
}
