"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut } from "lucide-react";
import { formatTime, formatWorkingHours } from "@/lib/utils/date";

interface AttendanceRecord {
  id: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingMinutes: number | null;
}

interface AttendanceCheckInOutProps {
  employeeId: string;
  initialAttendance: AttendanceRecord | null;
}

export function AttendanceCheckInOut({
  employeeId,
  initialAttendance,
}: AttendanceCheckInOutProps) {
  const [attendance, setAttendance] = useState(initialAttendance);
  const [pending, setPending] = useState(false);

  async function handleCheckIn() {
    setPending(true);
    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to check in");
        return;
      }
      setAttendance({
        id: data.data.id,
        checkInTime: data.data.checkInTime,
        checkOutTime: null,
        workingMinutes: null,
      });
      toast.success("Checked in successfully");
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  async function handleCheckOut() {
    setPending(true);
    try {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to check out");
        return;
      }
      setAttendance((prev) =>
        prev
          ? {
              ...prev,
              checkOutTime: data.data.checkOutTime,
              workingMinutes: data.data.workingMinutes,
            }
          : null
      );
      toast.success("Checked out successfully");
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  const hasCheckedIn = !!attendance?.checkInTime;
  const hasCheckedOut = !!attendance?.checkOutTime;

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-0.5">Attendance</p>
          {hasCheckedIn ? (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <LogIn className="h-3 w-3" />
                In {formatTime(attendance!.checkInTime!)}
              </span>
              {hasCheckedOut && (
                <>
                  <span className="flex items-center gap-1">
                    <LogOut className="h-3 w-3" />
                    Out {formatTime(attendance!.checkOutTime!)}
                  </span>
                  {attendance!.workingMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatWorkingHours(attendance!.workingMinutes)}
                    </span>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Not checked in yet</p>
          )}
        </div>

        <div className="flex gap-2">
          {!hasCheckedIn && (
            <Button size="sm" onClick={handleCheckIn} disabled={pending}>
              <LogIn className="h-3.5 w-3.5 mr-1.5" />
              Check In
            </Button>
          )}
          {hasCheckedIn && !hasCheckedOut && (
            <Button size="sm" variant="outline" onClick={handleCheckOut} disabled={pending}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Check Out
            </Button>
          )}
          {hasCheckedOut && (
            <span className="text-xs text-green-600 font-medium self-center">
              Done for today
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
