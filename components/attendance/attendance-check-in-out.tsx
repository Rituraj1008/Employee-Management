"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, Coffee, UtensilsCrossed } from "lucide-react";
import { formatTime, formatWorkingHours } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingMinutes: number | null;
  teaBreakMinutes: number;
  lunchBreakMinutes: number;
}

interface AttendanceCheckInOutProps {
  employeeId: string;
  initialAttendance: AttendanceRecord | null;
}

const TEA_SECS   = 15 * 60; // 900
const LUNCH_SECS = 45 * 60; // 2700

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AttendanceCheckInOut({ employeeId, initialAttendance }: AttendanceCheckInOutProps) {
  const [attendance,  setAttendance]  = useState(initialAttendance);
  const [localTea,   setLocalTea]    = useState(false);
  const [localLunch, setLocalLunch]  = useState(false);
  const [pending,    setPending]     = useState(false);

  // Countdown state: null = not running, 0 = finished, >0 = seconds remaining
  const [teaSecs,   setTeaSecs]   = useState<number | null>(null);
  const [lunchSecs, setLunchSecs] = useState<number | null>(null);
  const teaTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const lunchTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (teaTimer.current)   clearInterval(teaTimer.current);
      if (lunchTimer.current) clearInterval(lunchTimer.current);
    };
  }, []);

  function startCountdown(type: "tea" | "lunch") {
    const duration = type === "tea" ? TEA_SECS : LUNCH_SECS;
    const timerRef = type === "tea" ? teaTimer : lunchTimer;
    const setFn    = type === "tea" ? setTeaSecs : setLunchSecs;

    if (timerRef.current) clearInterval(timerRef.current);
    setFn(duration);

    timerRef.current = setInterval(() => {
      setFn((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopCountdown(type: "tea" | "lunch") {
    const timerRef = type === "tea" ? teaTimer : lunchTimer;
    const setFn    = type === "tea" ? setTeaSecs : setLunchSecs;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setFn(null);
  }

  const hasCheckedIn  = !!attendance?.checkInTime;
  const hasCheckedOut = !!attendance?.checkOutTime;
  const teaTaken      = hasCheckedIn ? attendance!.teaBreakMinutes   > 0 : localTea;
  const lunchTaken    = hasCheckedIn ? attendance!.lunchBreakMinutes > 0 : localLunch;
  const totalBreaks   = (attendance?.teaBreakMinutes ?? 0) + (attendance?.lunchBreakMinutes ?? 0);

  async function handleCheckIn() {
    if (hasCheckedIn) { toast.error("Already checked in for today"); return; }
    setPending(true);
    try {
      const res  = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          teaBreakMinutes:   localTea   ? 15 : 0,
          lunchBreakMinutes: localLunch ? 45 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to check in"); return; }
      setAttendance({
        id:                data.data.id,
        checkInTime:       data.data.checkInTime,
        checkOutTime:      null,
        workingMinutes:    null,
        teaBreakMinutes:   data.data.teaBreakMinutes,
        lunchBreakMinutes: data.data.lunchBreakMinutes,
      });
      toast.success("Checked in successfully");
    } catch { toast.error("Network error"); }
    finally { setPending(false); }
  }

  async function handleCheckOut() {
    if (!hasCheckedIn) { toast.error("Please check in first"); return; }
    if (hasCheckedOut)  { toast.error("Already checked out for today"); return; }
    // Stop any running timers on checkout
    stopCountdown("tea");
    stopCountdown("lunch");
    setPending(true);
    try {
      const res  = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to check out"); return; }
      setAttendance((prev) => prev
        ? { ...prev, checkOutTime: data.data.checkOutTime, workingMinutes: data.data.workingMinutes }
        : null
      );
      toast.success("Checked out successfully");
    } catch { toast.error("Network error"); }
    finally { setPending(false); }
  }

  async function handleBreak(type: "tea" | "lunch") {
    if (hasCheckedOut) { toast.error("Cannot change breaks after check-out"); return; }

    const isTaken = type === "tea" ? teaTaken : lunchTaken;
    const taken   = !isTaken;

    // Start / stop the countdown
    if (taken) startCountdown(type);
    else       stopCountdown(type);

    // Before check-in: toggle local state only, no API call
    if (!hasCheckedIn) {
      if (type === "tea") setLocalTea(taken);
      else                setLocalLunch(taken);
      return;
    }

    // After check-in: persist to DB
    try {
      const res  = await fetch("/api/attendance/break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, taken }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to update break"); return; }
      setAttendance((prev) => prev ? {
        ...prev,
        teaBreakMinutes:   type === "tea"   ? data.data.teaBreakMinutes   : prev.teaBreakMinutes,
        lunchBreakMinutes: type === "lunch" ? data.data.lunchBreakMinutes : prev.lunchBreakMinutes,
      } : null);
    } catch { toast.error("Network error"); }
  }

  // Sublabel for break button: countdown while running, "Done ✓" when 0, duration otherwise
  function breakLabel(type: "tea" | "lunch") {
    const taken   = type === "tea" ? teaTaken   : lunchTaken;
    const secs    = type === "tea" ? teaSecs    : lunchSecs;
    const default_ = type === "tea" ? "15 min"   : "45 min";
    if (!taken) return default_;
    if (secs === null) return `${default_} ✓`;  // taken from DB (prev session)
    if (secs === 0)    return "Done ✓";
    return fmt(secs);                             // live countdown
  }

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5 space-y-4">

      {/* Status line */}
      <div>
        <p className="text-sm font-medium mb-1">Today&apos;s Attendance</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {hasCheckedIn ? (
            <>
              <span className="flex items-center gap-1">
                <LogIn className="h-3 w-3" />
                In: {formatTime(attendance!.checkInTime!)}
              </span>
              {hasCheckedOut && (
                <>
                  <span className="flex items-center gap-1">
                    <LogOut className="h-3 w-3" />
                    Out: {formatTime(attendance!.checkOutTime!)}
                  </span>
                  {attendance!.workingMinutes != null && (
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Clock className="h-3 w-3" />
                      {formatWorkingHours(attendance!.workingMinutes)}
                      {totalBreaks > 0 && (
                        <span className="font-normal text-muted-foreground">({totalBreaks}m break deducted)</span>
                      )}
                    </span>
                  )}
                </>
              )}
              {!hasCheckedOut && totalBreaks > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="h-3 w-3" />
                  {totalBreaks}m break deducted
                </span>
              )}
            </>
          ) : (
            <span>Not checked in yet{(localTea || localLunch) ? " · breaks pre-selected" : ""}</span>
          )}
        </div>
      </div>

      {/* 4 buttons — always visible and clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">

        {/* Tea Break */}
        <button
          type="button"
          onClick={() => handleBreak("tea")}
          disabled={pending}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-lg border py-3 px-2 text-center transition-all",
            teaTaken
              ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
              : "bg-background border-border text-foreground hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700"
          )}
        >
          <Coffee className={cn("h-5 w-5", teaTaken ? "text-amber-500" : "text-muted-foreground")} />
          <span className="text-xs font-medium leading-tight">Tea Break</span>
          <span className={cn(
            "text-[10px] leading-tight tabular-nums",
            teaTaken ? "text-amber-600 font-semibold" : "text-muted-foreground"
          )}>
            {breakLabel("tea")}
          </span>
        </button>

        {/* Lunch Break */}
        <button
          type="button"
          onClick={() => handleBreak("lunch")}
          disabled={pending}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-lg border py-3 px-2 text-center transition-all",
            lunchTaken
              ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
              : "bg-background border-border text-foreground hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
          )}
        >
          <UtensilsCrossed className={cn("h-5 w-5", lunchTaken ? "text-blue-500" : "text-muted-foreground")} />
          <span className="text-xs font-medium leading-tight">Lunch Break</span>
          <span className={cn(
            "text-[10px] leading-tight tabular-nums",
            lunchTaken ? "text-blue-600 font-semibold" : "text-muted-foreground"
          )}>
            {breakLabel("lunch")}
          </span>
        </button>

        {/* Check In */}
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={pending}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-lg border py-3 px-2 text-center transition-all",
            hasCheckedIn
              ? "bg-green-50 border-green-300 text-green-700"
              : "bg-background border-border text-foreground hover:bg-green-50 hover:border-green-300 hover:text-green-700"
          )}
        >
          <LogIn className={cn("h-5 w-5", hasCheckedIn ? "text-green-600" : "text-muted-foreground")} />
          <span className="text-xs font-medium leading-tight">Check In</span>
          <span className={cn("text-[10px] leading-tight", hasCheckedIn ? "text-green-600 font-semibold" : "text-muted-foreground")}>
            {hasCheckedIn ? formatTime(attendance!.checkInTime!) : "Start day"}
          </span>
        </button>

        {/* Check Out */}
        <button
          type="button"
          onClick={handleCheckOut}
          disabled={pending}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-lg border py-3 px-2 text-center transition-all",
            hasCheckedOut
              ? "bg-red-50 border-red-300 text-red-700"
              : "bg-background border-border text-foreground hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          )}
        >
          <LogOut className={cn("h-5 w-5", hasCheckedOut ? "text-red-500" : "text-muted-foreground")} />
          <span className="text-xs font-medium leading-tight">Check Out</span>
          <span className={cn("text-[10px] leading-tight", hasCheckedOut ? "text-red-600 font-semibold" : "text-muted-foreground")}>
            {hasCheckedOut ? formatTime(attendance!.checkOutTime!) : "End day"}
          </span>
        </button>

      </div>
    </div>
  );
}
