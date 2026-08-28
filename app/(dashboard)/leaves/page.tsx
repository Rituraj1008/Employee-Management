import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { listLeaveRequests, listLeaveTypes, getLeaveBalance } from "@/services/leave.service";
import { LeavesPage } from "@/components/leaves/leaves-page";

export const metadata: Metadata = { title: "Leaves" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const isManagerOrAbove =
    session.role === RoleType.SUPER_ADMIN ||
    session.role === RoleType.HR ||
    session.role === RoleType.MANAGER;

  const [data, leaveTypes, balances] = await Promise.all([
    listLeaveRequests({
      employeeId: isManagerOrAbove ? undefined : session.employeeId,
      status: params.status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | undefined,
      page,
      limit: 20,
    }),
    listLeaveTypes(),
    session.employeeId ? getLeaveBalance(session.employeeId) : Promise.resolve([]),
  ]);

  return (
    <LeavesPage
      requests={data.requests.map((r) => ({
        id: r.id,
        employee: { firstName: r.employee.firstName, lastName: r.employee.lastName },
        leaveType: r.leaveType.name,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        totalDays: r.totalDays,
        reason: r.reason,
        status: r.status,
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
      isManagerOrAbove={isManagerOrAbove}
      employeeId={session.employeeId}
    />
  );
}
