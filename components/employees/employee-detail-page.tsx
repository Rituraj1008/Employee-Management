"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils/date";
import { ArrowLeft, Pencil, UserX, UserCheck, Clock, CalendarCheck, CalendarX, Coffee } from "lucide-react";
import { RoleType } from "@prisma/client";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "HR",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

interface AttendanceRecord {
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingMinutes: number | null;
  status: string;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
}

interface LeaveBalance {
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

interface EmployeeDetailPageProps {
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    role: RoleType;
    phone: string | null;
    department: { id: string; name: string } | null;
    designation: { id: string; name: string } | null;
    status: string;
    joiningDate: string;
  };
  departments: { id: string; name: string }[];
  designations: { id: string; name: string }[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
}

// ─── Attendance helpers ───────────────────────────────────────────────────────

type Period = "week" | "month" | "year";

interface BarItem {
  label: string;
  value: number;
  status: string;
  tooltip: string;
}

const BAR_COLORS: Record<string, string> = {
  PRESENT:  "#22c55e",
  HALF_DAY: "#f59e0b",
  ABSENT:   "#f87171",
  ON_LEAVE: "#60a5fa",
  WEEKEND:  "#e2e8f0",
  FUTURE:   "#f1f5f9",
};

const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function localStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function buildBars(records: AttendanceRecord[], period: Period): BarItem[] {
  const map = new Map(records.map((r) => [r.date, r]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === "week") {
    const bars: BarItem[] = [];
    for (let i = 6; i >= 0; i--) {
      const d   = new Date(today);
      d.setDate(d.getDate() - i);
      const key = localStr(d);
      const rec = map.get(key);
      const isWE = d.getDay() === 0 || d.getDay() === 6;
      const hrs  = rec?.workingMinutes != null ? rec.workingMinutes / 60 : 0;
      const st   = rec?.status ?? (isWE ? "WEEKEND" : "ABSENT");
      bars.push({ label: DAY_NAMES[d.getDay()], value: hrs, status: st, tooltip: `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}: ${hrs > 0 ? `${Math.round(hrs*10)/10}h` : st.toLowerCase()}` });
    }
    return bars;
  }

  if (period === "month") {
    const bars: BarItem[] = [];
    const yr = today.getFullYear(), mo = today.getMonth();
    const dim = new Date(yr, mo + 1, 0).getDate();
    for (let day = 1; day <= dim; day++) {
      const d    = new Date(yr, mo, day);
      const key  = localStr(d);
      const rec  = map.get(key);
      const isWE = d.getDay() === 0 || d.getDay() === 6;
      const isFut = d > today;
      const hrs  = !isFut && rec?.workingMinutes != null ? rec.workingMinutes / 60 : 0;
      const st   = isFut ? "FUTURE" : rec?.status ?? (isWE ? "WEEKEND" : "ABSENT");
      bars.push({ label: String(day), value: hrs, status: st, tooltip: `${day} ${MONTH_NAMES[mo]}: ${hrs > 0 ? `${Math.round(hrs*10)/10}h` : st.toLowerCase()}` });
    }
    return bars;
  }

  const yr = today.getFullYear();
  return MONTH_NAMES.map((label, m) => {
    if (m > today.getMonth()) return { label, value: 0, status: "FUTURE", tooltip: `${label}: future` };
    const ms = String(m+1).padStart(2,"0");
    let present = 0;
    for (const [key, rec] of map) {
      if (key.startsWith(`${yr}-${ms}`) && (rec.status === "PRESENT" || rec.status === "HALF_DAY")) present++;
    }
    return { label, value: present, status: present > 0 ? "PRESENT" : "ABSENT", tooltip: `${label}: ${present} day${present !== 1 ? "s" : ""} present` };
  });
}

function computeStats(bars: BarItem[], period: Period, records: AttendanceRecord[]) {
  if (period === "year") {
    const yr  = new Date().getFullYear();
    const src = records.filter((r) => r.date.startsWith(String(yr)));
    const totalH = Math.round(src.reduce((s, r) => s + (r.workingMinutes ?? 0), 0) / 60);
    return { present: src.filter((r) => r.status === "PRESENT").length, halfDay: src.filter((r) => r.status === "HALF_DAY").length, onLeave: src.filter((r) => r.status === "ON_LEAVE").length, absent: bars.filter((b) => b.status === "ABSENT").length, totalHours: totalH, avgHours: 0 };
  }
  const pCount = bars.filter((b) => b.status === "PRESENT").length;
  const hCount = bars.filter((b) => b.status === "HALF_DAY").length;
  const totalH = Math.round(bars.reduce((s, b) => s + b.value, 0) * 10) / 10;
  const worked = pCount + hCount;
  return { present: pCount, halfDay: hCount, onLeave: bars.filter((b) => b.status === "ON_LEAVE").length, absent: bars.filter((b) => b.status === "ABSENT").length, totalHours: totalH, avgHours: worked > 0 ? Math.round(totalH / worked * 10) / 10 : 0 };
}

// ─── Animated SVG Line Chart ─────────────────────────────────────────────────

function AttendanceChart({ bars, period }: { bars: BarItem[]; period: Period }) {
  const lineRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    el.style.transition = "none";
    const len = el.getTotalLength();
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    void el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1)";
    el.style.strokeDashoffset = "0";
  }, [bars]);

  const n = bars.length;
  if (n === 0) return null;

  // Fixed coordinate space — responsive via viewBox + padding-bottom trick
  const W = 700, H = 180;
  const P = { l: 8, r: 8, t: 22, b: 32 };
  const cW = W - P.l - P.r, cH = H - P.t - P.b;

  const maxVal = period === "year"
    ? Math.max(...bars.map((b) => b.value), 4)
    : Math.max(...bars.map((b) => b.value), 1);

  const pts = bars.map((bar, i) => ({
    x: P.l + (n > 1 ? (i / (n - 1)) * cW : cW / 2),
    y: P.t + cH - (bar.value / maxVal) * cH,
    bar,
  }));

  function makeLine(points: { x: number; y: number }[]) {
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const t  = 0.3;
      d += ` C ${(p1.x+(p2.x-p0.x)*t).toFixed(2)} ${(p1.y+(p2.y-p0.y)*t).toFixed(2)}, ${(p2.x-(p3.x-p1.x)*t).toFixed(2)} ${(p2.y-(p3.y-p1.y)*t).toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  }

  const line = makeLine(pts);
  const area = `${line} L ${pts[pts.length-1].x.toFixed(2)} ${(P.t+cH).toFixed(2)} L ${pts[0].x.toFixed(2)} ${(P.t+cH).toFixed(2)} Z`;

  const showEvery = n > 25 ? Math.ceil(n / 14) : n > 14 ? 2 : 1;
  const dotR      = n > 25 ? 1.8 : n > 14 ? 2.5 : 3.5;
  const fs        = n > 25 ? 5 : n > 14 ? 5.5 : 7;
  const dotStart  = 1.1;
  const dotSpread = 0.7;

  return (
    // padding-bottom trick: height = width × (H/W) — no letterboxing on any screen width
    <div className="relative w-full" style={{ paddingBottom: `${(H / W * 100).toFixed(2)}%` }}>
      <svg
        key={period}
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.22" />
            <stop offset="75%"  stopColor="#6366f1" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"    />
          </linearGradient>
          <clipPath id="attClip">
            <rect x={P.l} y={P.t} width={cW} height={cH} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <line key={pct} x1={P.l} y1={P.t + cH*(1-pct)} x2={W-P.r} y2={P.t + cH*(1-pct)} stroke="#f1f5f9" strokeWidth={1} />
        ))}
        <line x1={P.l} y1={P.t+cH} x2={W-P.r} y2={P.t+cH} stroke="#e2e8f0" strokeWidth={1} />

        {/* Gradient fill */}
        <path d={area} fill="url(#attGrad)" clipPath="url(#attClip)" />

        {/* Animated line */}
        <path ref={lineRef} d={line} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {pts.map((pt, i) => {
          const color = BAR_COLORS[pt.bar.status] ?? "#6366f1";
          const delay = dotStart + (n > 1 ? (i / (n-1)) * dotSpread : 0);
          return (
            <g key={i}>
              <title>{pt.bar.tooltip}</title>
              <circle cx={pt.x} cy={pt.y} r={dotR+2} fill={color} opacity={0}>
                <animate attributeName="opacity" from="0" to="0.18" dur="0.4s" begin={`${delay.toFixed(2)}s`} fill="freeze" />
              </circle>
              <circle cx={pt.x} cy={pt.y} r="0" fill="white" stroke={color} strokeWidth={1.8}>
                <animate attributeName="r" values={`0;${dotR*1.4};${dotR}`} keyTimes="0;0.6;1" dur="0.35s" begin={`${delay.toFixed(2)}s`} fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
              </circle>
            </g>
          );
        })}

        {/* X-axis labels */}
        {bars.map((bar, i) => {
          if (i % showEvery !== 0 && i !== n-1) return null;
          const x = P.l + (n > 1 ? (i / (n-1)) * cW : cW / 2);
          return <text key={i} x={x} y={H-5} textAnchor="middle" fontSize={fs} fill="#94a3b8">{bar.label}</text>;
        })}
      </svg>
    </div>
  );
}

// ─── Leave status colors ──────────────────────────────────────────────────────

const LEAVE_COLORS: Record<string, string> = {
  PENDING:   "text-amber-600 border-amber-200 bg-amber-50",
  APPROVED:  "text-green-700 border-green-200 bg-green-50",
  REJECTED:  "text-red-600  border-red-200  bg-red-50",
  CANCELLED: "text-zinc-500 border-zinc-200 bg-zinc-50",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function EmployeeDetailPage({
  employee,
  departments,
  designations,
  attendanceRecords,
  leaveRequests,
  leaveBalances,
}: EmployeeDetailPageProps) {
  const router = useRouter();
  const [editing,        setEditing]        = useState(false);
  const [pending,        setPending]        = useState(false);
  const [period,         setPeriod]         = useState<Period>("week");
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating,   setDeactivating]   = useState(false);
  const [activateOpen,   setActivateOpen]   = useState(false);
  const [activating,     setActivating]     = useState(false);

  const bars  = buildBars(attendanceRecords, period);
  const stats = computeStats(bars, period, attendanceRecords);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res  = await fetch(`/api/employees/${employee.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Update failed"); return; }
      toast.success("Employee updated");
      setEditing(false);
      router.refresh();
    } catch { toast.error("Network error"); }
    finally { setPending(false); }
  }

  async function handleActivateConfirm() {
    setActivating(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ACTIVE" }) });
      if (!res.ok) { toast.error("Failed to activate"); return; }
      toast.success("Employee activated");
      setActivateOpen(false);
      router.refresh();
    } catch { toast.error("Network error"); }
    finally { setActivating(false); }
  }

  async function handleDeactivateConfirm() {
    setDeactivating(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to deactivate"); return; }
      toast.success("Employee deactivated");
      router.push("/employees");
    } catch { toast.error("Network error"); }
    finally { setDeactivating(false); setDeactivateOpen(false); }
  }

  const STAT_CARDS = [
    { icon: <CalendarCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />, label: period === "year" ? "Days Present" : "Present",                                        value: stats.present,                                                                          color: "text-green-600" },
    { icon: <CalendarX     className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400   shrink-0" />, label: "Absent",                                                                              value: stats.absent,                                                                           color: "text-red-400"  },
    { icon: <Coffee        className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500  shrink-0" />, label: "On Leave",                                                                            value: stats.onLeave,                                                                          color: "text-blue-500" },
    { icon: <Clock         className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />, label: period === "year" ? "Total Hours" : "Avg/Day", value: period === "year" ? `${stats.totalHours}h` : stats.avgHours > 0 ? `${stats.avgHours}h` : "—", color: "text-foreground" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl w-full">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-base font-semibold truncate leading-tight">
            {employee.firstName} {employee.lastName}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{employee.employeeCode}</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {employee.status === "ACTIVE" && (
            <Button variant="outline" size="sm" className="h-8 text-xs px-2.5 sm:px-3" onClick={() => setDeactivateOpen(true)}>
              <UserX className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Deactivate</span>
            </Button>
          )}
          {employee.status === "INACTIVE" && (
            <Button variant="outline" size="sm" className="h-8 text-xs px-2.5 sm:px-3 text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700" onClick={() => setActivateOpen(true)}>
              <UserCheck className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Activate</span>
            </Button>
          )}
          <Button size="sm" className="h-8 text-xs px-2.5 sm:px-3" onClick={() => setEditing(!editing)}>
            <Pencil className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{editing ? "Cancel" : "Edit"}</span>
          </Button>
        </div>
      </div>

      {/* ── Employee info / edit ────────────────────────────────────────── */}
      {!editing ? (
        <div className="rounded-lg border bg-card divide-y text-sm">
          {[
            { label: "Email",        value: employee.email },
            { label: "Phone",        value: employee.phone || "—" },
            { label: "Department",   value: employee.department?.name || "—" },
            { label: "Designation",  value: employee.designation?.name || "—" },
            { label: "Role",         value: ROLE_LABELS[employee.role] },
            { label: "Joining Date", value: formatDate(employee.joiningDate) },
            {
              label: "Status",
              value: (
                <Badge variant="outline" className={`text-xs ${employee.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-200" : "bg-zinc-50 text-zinc-500 border-zinc-200"}`}>
                  {employee.status.charAt(0) + employee.status.slice(1).toLowerCase()}
                </Badge>
              ),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between px-4 sm:px-5 py-2.5 sm:py-3 gap-3">
              <span className="text-xs sm:text-sm text-muted-foreground w-24 sm:w-32 shrink-0 pt-px">{label}</span>
              <span className="text-xs sm:text-sm font-medium text-right break-all leading-relaxed">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="rounded-lg border bg-card p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">First Name</Label>
              <Input name="firstName" defaultValue={employee.firstName} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Last Name</Label>
              <Input name="lastName" defaultValue={employee.lastName} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Phone</Label>
            <Input name="phone" defaultValue={employee.phone || ""} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Department</Label>
              <Select name="departmentId" defaultValue={employee.department?.id || ""}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Designation</Label>
              <Select name="designationId" defaultValue={employee.designation?.id || ""}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{designations.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Role</Label>
            <Select name="role" defaultValue={employee.role}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      )}

      {/* ── Attendance ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card overflow-hidden">

        {/* Header + period filter */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b">
          <h3 className="text-sm font-semibold">Attendance</h3>
          <div className="flex rounded-md overflow-hidden border text-xs">
            {(["week","month","year"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 capitalize transition-colors",
                  period === p
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-background hover:bg-muted text-muted-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Stats — 2 cols mobile / 4 cols desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b">
          {STAT_CARDS.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3",
                i % 2 === 1 && "border-l",         // right col on mobile
                i > 0       && "sm:border-l",       // all-but-first on desktop
                i >= 2      && "border-t sm:border-t-0", // second row on mobile only
              )}
            >
              {s.icon}
              <div className="min-w-0">
                <p className={cn("text-base sm:text-lg font-semibold tabular-nums leading-tight", s.color)}>
                  {s.value}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Line chart — padding-bottom trick ensures no letterboxing on any screen */}
        <div className="px-3 sm:px-5 pt-4 pb-1">
          <AttendanceChart bars={bars} period={period} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1.5 px-3 sm:px-5 pb-3 sm:pb-4">
          {[
            { color: BAR_COLORS.PRESENT,  label: "Present"  },
            { color: BAR_COLORS.HALF_DAY, label: "Half Day" },
            { color: BAR_COLORS.ON_LEAVE, label: "On Leave" },
            { color: BAR_COLORS.ABSENT,   label: "Absent"   },
            { color: BAR_COLORS.WEEKEND,  label: "Weekend"  },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-[2px] shrink-0" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Leave ──────────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card overflow-hidden">

        {/* Card header */}
        <div className="px-4 sm:px-5 py-3 border-b">
          <h3 className="text-sm font-semibold">Leave</h3>
        </div>

        {/* Leave balance cards — 2 cols always, names truncated */}
        {leaveBalances.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3 sm:p-5 border-b">
            {leaveBalances.map((b) => {
              const pct = b.totalDays > 0 ? Math.min((b.usedDays / b.totalDays) * 100, 100) : 0;
              return (
                <div key={b.leaveTypeName} className="rounded-lg border bg-muted/30 p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate mb-1">{b.leaveTypeName}</p>
                  <p className="text-base sm:text-lg font-semibold tabular-nums leading-tight">
                    {b.remainingDays}
                    <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">left</span>
                  </p>
                  <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{b.usedDays}/{b.totalDays} used</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Leave request history */}
        <div className="p-3 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground mb-2.5">
            All Requests ({leaveRequests.length})
          </p>

          {leaveRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No leave requests</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5 whitespace-nowrap">Type</th>
                      {/* Mobile: single merged "Period" col; sm+: separate Start/End */}
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5 whitespace-nowrap sm:hidden">Period</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5 whitespace-nowrap hidden sm:table-cell">Start</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5 whitespace-nowrap hidden sm:table-cell">End</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5 hidden sm:table-cell">Days</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5 whitespace-nowrap">Status</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5 whitespace-nowrap hidden md:table-cell">Applied</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5 hidden lg:table-cell">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 font-medium whitespace-nowrap">{req.leaveType}</td>

                        {/* Mobile merged period */}
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap sm:hidden">
                          {formatDate(req.startDate)}
                          {req.startDate !== req.endDate && <> – {formatDate(req.endDate)}</>}
                        </td>

                        {/* Desktop separate cols */}
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap hidden sm:table-cell">{formatDate(req.startDate)}</td>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap hidden sm:table-cell">{formatDate(req.endDate)}</td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{req.totalDays}d</td>

                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={cn("text-[10px] sm:text-xs px-1.5 py-0", LEAVE_COLORS[req.status])}>
                            {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                          </Badge>
                        </td>

                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap hidden md:table-cell">{formatDate(req.createdAt)}</td>

                        <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell max-w-[180px]">
                          <p className="truncate" title={req.reason}>{req.reason}</p>
                          {req.reviewNote && (
                            <p className="truncate text-muted-foreground/60 mt-0.5" title={req.reviewNote}>
                              Note: {req.reviewNote}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Activate confirmation dialog ───────────────────────────────── */}
      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              Activate Employee
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to activate{" "}
              <span className="font-medium text-foreground">
                {employee.firstName} {employee.lastName}
              </span>
              ? They will regain access to the system immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setActivateOpen(false)} disabled={activating}>
              Cancel
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleActivateConfirm} disabled={activating}>
              {activating ? "Activating…" : "Yes, Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate confirmation dialog ─────────────────────────────── */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-destructive" />
              Deactivate Employee
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <span className="font-medium text-foreground">
                {employee.firstName} {employee.lastName}
              </span>
              ? They will lose access to the system immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDeactivateOpen(false)} disabled={deactivating}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeactivateConfirm} disabled={deactivating}>
              {deactivating ? "Deactivating…" : "Yes, Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
