import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { listLeaveRequests, listLeaveTypes, getLeaveBalance } from "@/services/leave.service";
import { LeavesPage } from "@/components/leaves/leaves-page";
import { AdminLeavesPage } from "@/components/leaves/admin-leaves-page";
import { getCurrentYear } from "@/lib/utils/date";
import type { Prisma, LeaveStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Leaves" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; type?: string; search?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const isSuperAdmin = session.role === RoleType.SUPER_ADMIN;
  const isHR = session.role === RoleType.HR;
  const canSeeAll = isSuperAdmin || isHR;

  /* ── Admin / HR view: full leave management ── */
  if (canSeeAll) {
    // Build employee filter
    const employeeWhere: Prisma.EmployeeWhereInput = {};
    if (isHR) {
      employeeWhere.user = { role: { not: RoleType.SUPER_ADMIN } };
    }
    if (params.search) {
      const search = params.search;
      employeeWhere.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
      ];
      // When search + HR filter both needed, combine via AND
      if (isHR) {
        employeeWhere.AND = [
          { user: { role: { not: RoleType.SUPER_ADMIN } } },
          {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { employeeCode: { contains: search, mode: "insensitive" } },
            ],
          },
        ];
        delete employeeWhere.user;
        delete employeeWhere.OR;
      }
    }

    const where: Prisma.LeaveRequestWhereInput = {
      employee: employeeWhere,
    };
    if (params.status && params.status !== "all") {
      where.status = params.status as LeaveStatus;
    }
    if (params.type && params.type !== "all") {
      where.leaveTypeId = params.type;
    }

    // Base where for status counts (without status/type filter, just employee filter)
    const countWhere: Prisma.LeaveRequestWhereInput = {
      employee: isHR ? { user: { role: { not: RoleType.SUPER_ADMIN } } } : {},
    };

    const [requests, total, leaveTypes, statusCounts] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              joiningDate: true,
              user: { select: { role: true } },
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
          leaveType: { select: { id: true, name: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * 15,
        take: 15,
      }),
      prisma.leaveRequest.count({ where }),
      prisma.leaveType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.leaveRequest.groupBy({
        by: ["status"],
        where: countWhere,
        _count: true,
      }),
    ]);

    const statusCnt = { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 };
    for (const g of statusCounts) {
      statusCnt[g.status as keyof typeof statusCnt] = g._count;
    }

    return (
      <AdminLeavesPage
        requests={requests.map((r) => ({
          id: r.id,
          employee: {
            id: r.employee.id,
            employeeCode: r.employee.employeeCode,
            firstName: r.employee.firstName,
            lastName: r.employee.lastName,
            role: r.employee.user.role,
            department: r.employee.department?.name ?? null,
            designation: r.employee.designation?.name ?? null,
            joiningDate: r.employee.joiningDate.toISOString(),
          },
          leaveType: { id: r.leaveType.id, name: r.leaveType.name },
          startDate: r.startDate.toISOString(),
          endDate: r.endDate.toISOString(),
          totalDays: r.totalDays,
          reason: r.reason,
          status: r.status,
          reviewNote: r.reviewNote,
          reviewedAt: r.reviewedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
        total={total}
        page={page}
        totalPages={Math.ceil(total / 15)}
        leaveTypes={leaveTypes.map((t) => ({ id: t.id, name: t.name }))}
        statusCounts={statusCnt}
      />
    );
  }

  /* ── Employee / Manager view: own leaves only ── */
  const data = await listLeaveRequests({
    employeeId: session.employeeId,
    status: params.status as LeaveStatus | undefined,
    page,
    limit: 20,
  });

  const [leaveTypes, balances] = await Promise.all([
    listLeaveTypes(),
    session.employeeId ? getLeaveBalance(session.employeeId) : Promise.resolve([]),
  ]);

  return (
    <LeavesPage
      requests={data.requests.map((r) => ({
        id: r.id,
        employee: {
          firstName: r.employee.firstName,
          lastName: r.employee.lastName,
          role: r.employee.user.role,
        },
        leaveType: r.leaveType.name,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        totalDays: r.totalDays,
        reason: r.reason,
        status: r.status,
        reviewNote: r.reviewNote,
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      }))}
      total={data.total}
      page={page}
      totalPages={data.totalPages}
      leaveTypes={leaveTypes.map((t) => ({ id: t.id, name: t.name }))}
      balances={balances.map((b) => ({
        leaveTypeName: b.leaveType.name,
        totalDays: b.totalDays,
        usedDays: b.usedDays,
        remainingDays: b.remainingDays,
      }))}
      canSeeAll={false}
      canApprove={false}
      employeeId={session.employeeId}
    />
  );
}
