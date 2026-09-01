"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate, formatTime, formatWorkingHours } from "@/lib/utils/date";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────────────────────── */

export interface EmployeeAttendanceRow {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string | null;
  designation: string | null;
  attendance: {
    id: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    workingMinutes: number | null;
    teaBreakMinutes: number;
    lunchBreakMinutes: number;
    status: string;
  } | null;
}

interface AdminAttendancePageProps {
  rows: EmployeeAttendanceRow[];
  date: string; // "yyyy-MM-dd"
  departments: { id: string; name: string }[];
}

/* ── Constants ───────────────────────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  PRESENT:  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  ABSENT:   "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  HALF_DAY: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  ON_LEAVE: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  NOT_MARKED: "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

function statusLabel(s: string) {
  return s.replace("_", " ").charAt(0) + s.replace("_", " ").slice(1).toLowerCase();
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ── Component ───────────────────────────────────────────────────────────────── */

export function AdminAttendancePage({ rows, date, departments }: AdminAttendancePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Filters (client-side)
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit dialog state
  const [editRow, setEditRow] = useState<EmployeeAttendanceRow | null>(null);
  const [editStatus, setEditStatus] = useState("PRESENT");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Date navigation ───────────────────────────────────────────────────── */

  function goToDate(newDate: string) {
    startTransition(() => router.push(`/attendance?date=${newDate}`));
  }

  const isToday = date === new Date().toISOString().slice(0, 10);

  /* ── Stats ─────────────────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    let present = 0, absent = 0, halfDay = 0, onLeave = 0, notMarked = 0;
    for (const r of rows) {
      if (!r.attendance) { notMarked++; continue; }
      switch (r.attendance.status) {
        case "PRESENT":  present++;  break;
        case "ABSENT":   absent++;   break;
        case "HALF_DAY": halfDay++;  break;
        case "ON_LEAVE": onLeave++;  break;
        default:         notMarked++; break;
      }
    }
    return { present, absent, halfDay, onLeave, notMarked, total: rows.length };
  }, [rows]);

  /* ── Filtered rows ─────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        const name = `${r.firstName} ${r.lastName}`.toLowerCase();
        if (!name.includes(q) && !r.employeeCode.toLowerCase().includes(q)) return false;
      }
      if (deptFilter !== "all" && r.department !== deptFilter) return false;
      if (statusFilter !== "all") {
        const s = r.attendance?.status ?? "NOT_MARKED";
        if (s !== statusFilter) return false;
      }
      return true;
    });
  }, [rows, search, deptFilter, statusFilter]);

  /* ── Open edit modal ───────────────────────────────────────────────────── */

  function openEdit(row: EmployeeAttendanceRow) {
    setEditRow(row);
    setEditStatus(row.attendance?.status ?? "PRESENT");
    setEditCheckIn(
      row.attendance?.checkInTime
        ? formatTime(row.attendance.checkInTime)
        : ""
    );
    setEditCheckOut(
      row.attendance?.checkOutTime
        ? formatTime(row.attendance.checkOutTime)
        : ""
    );
  }

  /* ── Save attendance ───────────────────────────────────────────────────── */

  async function handleSave() {
    if (!editRow) return;
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: editRow.employeeId,
          date,
          status: editStatus,
          checkInTime:  editCheckIn  || undefined,
          checkOutTime: editCheckOut || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success(`Attendance updated for ${editRow.firstName} ${editRow.lastName}`);
      setEditRow(null);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Attendance Monitor</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          View and update every employee's attendance
        </p>
      </div>

      {/* ── Date navigation ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => goToDate(shiftDate(date, -1))}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card hover:bg-accent transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => e.target.value && goToDate(e.target.value)}
          className="h-8 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => goToDate(shiftDate(date, 1))}
          disabled={isToday}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {!isToday && (
          <Button size="sm" variant="outline" onClick={() => goToDate(new Date().toISOString().slice(0, 10))}>
            Today
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-1">
          {formatDate(date + "T00:00:00.000Z")}
        </span>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total",      value: stats.total,     icon: Users,      cls: "text-foreground",                    bg: "bg-muted" },
          { label: "Present",    value: stats.present,   icon: UserCheck,  cls: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Absent",     value: stats.absent,    icon: UserX,      cls: "text-red-700 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-950/40" },
          { label: "Half Day",   value: stats.halfDay,   icon: Clock,      cls: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/40" },
          { label: "On Leave",   value: stats.onLeave,   icon: CalendarOff, cls: "text-blue-700 dark:text-blue-400",  bg: "bg-blue-50 dark:bg-blue-950/40" },
        ].map(({ label, value, icon: Icon, cls, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", bg)}>
              <Icon className={cn("h-4 w-4", cls)} />
            </div>
            <div>
              <p className={cn("text-xl font-bold tabular-nums leading-none", cls)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search employees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-36">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PRESENT">Present</SelectItem>
            <SelectItem value="ABSENT">Absent</SelectItem>
            <SelectItem value="HALF_DAY">Half Day</SelectItem>
            <SelectItem value="ON_LEAVE">On Leave</SelectItem>
            <SelectItem value="NOT_MARKED">Not Marked</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Employee</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap hidden md:table-cell">Department</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Check In</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap hidden sm:table-cell">Check Out</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap hidden lg:table-cell">Hours</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Status</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No records match</p>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const att = row.attendance;
                  const status = att?.status ?? "NOT_MARKED";
                  return (
                    <tr key={row.employeeId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {row.firstName} {row.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{row.employeeCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {row.department ?? <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground whitespace-nowrap">
                        {att?.checkInTime ? formatTime(att.checkInTime) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                        {att?.checkOutTime ? formatTime(att.checkOutTime) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                        {att?.workingMinutes ? formatWorkingHours(att.workingMinutes) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn("text-xs capitalize", STATUS_COLORS[status])}
                        >
                          {statusLabel(status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEdit(row)}
                          aria-label="Edit attendance"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit dialog ── */}
      <Dialog open={!!editRow} onOpenChange={(o) => { if (!o) setEditRow(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Attendance</DialogTitle>
          </DialogHeader>

          {editRow && (
            <div className="space-y-4 pt-1">
              {/* Employee info */}
              <div className="rounded-lg bg-muted/40 px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {editRow.firstName} {editRow.lastName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editRow.department ?? "No department"} · {formatDate(date + "T00:00:00.000Z")}
                </p>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Times — only relevant for PRESENT / HALF_DAY */}
              {(editStatus === "PRESENT" || editStatus === "HALF_DAY") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="checkIn">Check In</Label>
                    <Input
                      id="checkIn"
                      type="time"
                      value={editCheckIn}
                      onChange={(e) => setEditCheckIn(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="checkOut">Check Out</Label>
                    <Input
                      id="checkOut"
                      type="time"
                      value={editCheckOut}
                      onChange={(e) => setEditCheckOut(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
