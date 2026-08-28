import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { getAttendanceHistory } from "@/services/attendance.service";
import { prisma } from "@/lib/prisma";
import { AttendancePage } from "@/components/attendance/attendance-page";

export const metadata: Metadata = { title: "Attendance" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  if (!session.employeeId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Employee profile not found.</p>
      </div>
    );
  }

  const data = await getAttendanceHistory(session.employeeId, { page, limit: 20 });

  return (
    <AttendancePage
      records={data.records.map((r) => ({
        id: r.id,
        date: r.date.toISOString(),
        checkInTime: r.checkInTime?.toISOString() ?? null,
        checkOutTime: r.checkOutTime?.toISOString() ?? null,
        workingMinutes: r.workingMinutes,
        status: r.status,
      }))}
      total={data.total}
      page={page}
      totalPages={data.totalPages}
      employeeId={session.employeeId}
    />
  );
}
