"use client";

import { formatDate, formatTime, formatWorkingHours } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { AttendanceCheckInOut } from "./attendance-check-in-out";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Coffee, UtensilsCrossed } from "lucide-react";
import { HrAttendanceTabs } from "./hr-attendance-tabs";

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingMinutes: number | null;
  teaBreakMinutes: number;
  lunchBreakMinutes: number;
  status: string;
}

interface AttendancePageProps {
  records: AttendanceRecord[];
  total: number;
  page: number;
  totalPages: number;
  employeeId: string;
  isHr?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PRESENT:  "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900",
  ABSENT:   "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  HALF_DAY: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  ON_LEAVE: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
};

export function AttendancePage({ records, total, page, totalPages, employeeId, isHr }: AttendancePageProps) {
  const router = useRouter();
  const today   = records[0];
  const isToday = today && formatDate(today.date) === formatDate(new Date());

  const todayAttendance = isToday
    ? {
        id:               today.id,
        checkInTime:      today.checkInTime,
        checkOutTime:     today.checkOutTime,
        workingMinutes:   today.workingMinutes,
        teaBreakMinutes:  today.teaBreakMinutes,
        lunchBreakMinutes: today.lunchBreakMinutes,
      }
    : null;

  function goToPage(p: number) {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (isHr) params.set("view", "mine");
    router.push(`/attendance?${params.toString()}`);
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">My Attendance</h2>
          <p className="text-sm text-muted-foreground">{total} records total</p>
        </div>
        {isHr && <HrAttendanceTabs active="mine" />}
      </div>

      <AttendanceCheckInOut employeeId={employeeId} initialAttendance={todayAttendance} />

      {/* History table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Date</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Check In</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Check Out</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Breaks</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Hours</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-10 px-4">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const tea   = record.teaBreakMinutes   > 0;
                  const lunch = record.lunchBreakMinutes > 0;
                  return (
                    <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {record.checkInTime ? formatTime(record.checkInTime) : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {record.checkOutTime ? formatTime(record.checkOutTime) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {tea || lunch ? (
                          <div className="flex items-center gap-1.5">
                            {tea   && <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Coffee          className="h-3 w-3" />15m</span>}
                            {lunch && <span className="inline-flex items-center gap-1 text-xs text-blue-600" ><UtensilsCrossed className="h-3 w-3" />45m</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                        {record.workingMinutes ? formatWorkingHours(record.workingMinutes) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[record.status] || ""}`}>
                          {record.status.charAt(0) + record.status.slice(1).toLowerCase().replace("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => goToPage(page - 1)} disabled={page <= 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
