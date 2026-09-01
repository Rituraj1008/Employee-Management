"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IndianRupee, Calendar, Loader2, Eye, FileText,
  Building2, CheckCircle2, AlertCircle,
} from "lucide-react";

/* ─── Types ─── */

interface MySalary {
  baseSalary: number;
  effectiveFrom: string;
}

interface MySlip {
  id: string;
  month: number;
  year: number;
  baseSalary: number;
  workingDays: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  deductions: number;
  netSalary: number;
  createdAt: string;
}

interface MySalaryPageProps {
  employeeName: string;
  employeeCode: string;
  role: string;
  department: string | null;
  designation: string | null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ROLE_LABELS: Record<string, string> = {
  HR: "HR", MANAGER: "Manager", EMPLOYEE: "Employee",
};

const ROLE_STYLES: Record<string, string> = {
  HR: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  MANAGER: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EMPLOYEE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
};

function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function SlipRow({
  label, value, color, deduction,
}: {
  label: string;
  value: string;
  color?: "emerald" | "amber" | "blue" | "red";
  deduction?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-700 dark:text-emerald-400",
    amber: "text-amber-700 dark:text-amber-400",
    blue: "text-blue-700 dark:text-blue-400",
    red: "text-red-700 dark:text-red-400",
  };
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs">{label}</span>
      <div className="flex items-center gap-2">
        {deduction && <span className="text-xs text-red-600 dark:text-red-400">{deduction}</span>}
        <span className={`text-xs tabular-nums ${color ? colorMap[color] : ""}`}>{value}</span>
      </div>
    </div>
  );
}

export function MySalaryPage({
  employeeName, employeeCode, role, department, designation,
}: MySalaryPageProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [salary, setSalary] = useState<MySalary | null>(null);
  const [slip, setSlip] = useState<MySlip | null | "none">(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  async function loadSlip(m = month, y = year) {
    setLoading(true);
    try {
      const res = await fetch(`/api/salary/me?month=${m}&year=${y}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to load salary"); return; }
      setSalary(data.data.salary);
      setSlip(data.data.slip ?? "none");
      setInitialLoaded(true);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handlePeriodChange(nextMonth: number, nextYear: number) {
    setMonth(nextMonth);
    setYear(nextYear);
    setSlip(null);
    setInitialLoaded(false);
  }

  const displaySlip = slip !== "none" ? slip : null;
  const hasSlip = slip !== null && slip !== "none";

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold">My Salary</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          View your salary details and monthly pay slips
        </p>
      </div>

      {/* Employee card */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
          {employeeName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{employeeName}</span>
            <span className="text-xs text-muted-foreground">{employeeCode}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_STYLES[role] ?? ""}`}>
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
            {department && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {department}
              </span>
            )}
            {designation && <span>{designation}</span>}
          </div>
        </div>

        {/* Base salary badge */}
        {salary && (
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <IndianRupee className="h-4 w-4" />
              <span className="text-lg font-bold">{fmtINR(salary.baseSalary)}</span>
            </div>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
        )}
      </div>

      {/* No salary set message */}
      {initialLoaded && !salary && (
        <div className="rounded-xl border border-border bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Salary not configured</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your base salary hasn&apos;t been set yet. Please contact your administrator.
            </p>
          </div>
        </div>
      )}

      {/* Month/Year picker */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Pay Slip</p>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 bg-card">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              className="text-sm bg-transparent border-0 outline-none pr-1"
              value={month}
              onChange={(e) => handlePeriodChange(Number(e.target.value), year)}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              className="text-sm bg-transparent border-0 outline-none"
              value={year}
              onChange={(e) => handlePeriodChange(month, Number(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            onClick={() => loadSlip(month, year)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            View Slip
          </Button>
        </div>
      </div>

      {/* Slip not generated yet */}
      {initialLoaded && slip === "none" && (
        <div className="rounded-xl border border-border bg-muted/20 py-10 text-center">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No slip for {MONTH_NAMES[month - 1]} {year}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Salary slip for this month hasn&apos;t been generated yet. Contact your administrator.
          </p>
        </div>
      )}

      {/* Slip detail */}
      {hasSlip && displaySlip && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {MONTH_NAMES[displaySlip.month - 1]} {displaySlip.year} — Slip Generated
            </p>
          </div>

          {/* Earnings */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Earnings</p>
            </div>
            <div className="p-4 space-y-2">
              <SlipRow label="Base Salary" value={fmtINR(displaySlip.baseSalary)} />
              <Separator />
              <SlipRow label="Working Days in Month" value={String(displaySlip.workingDays)} />
              <SlipRow
                label="Daily Rate"
                value={fmtINR(displaySlip.baseSalary / displaySlip.workingDays)}
              />
            </div>
          </div>

          {/* Attendance */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attendance</p>
            </div>
            <div className="p-4 space-y-2">
              <SlipRow
                label="Present"
                value={`${displaySlip.presentDays} day${displaySlip.presentDays !== 1 ? "s" : ""}`}
                color="emerald"
              />
              <SlipRow
                label="Half Day"
                value={`${displaySlip.halfDays} day${displaySlip.halfDays !== 1 ? "s" : ""}`}
                color="amber"
                deduction={
                  displaySlip.halfDays > 0
                    ? `-${fmtINR((displaySlip.baseSalary / displaySlip.workingDays) * 0.5 * displaySlip.halfDays)}`
                    : undefined
                }
              />
              <SlipRow
                label="Paid Leave (Approved)"
                value={`${displaySlip.paidLeaveDays} day${displaySlip.paidLeaveDays !== 1 ? "s" : ""}`}
                color="blue"
              />
              <SlipRow
                label="Absent (No leave approved)"
                value={`${displaySlip.absentDays} day${displaySlip.absentDays !== 1 ? "s" : ""}`}
                color={displaySlip.absentDays > 0 ? "red" : undefined}
                deduction={
                  displaySlip.absentDays > 0
                    ? `-${fmtINR((displaySlip.baseSalary / displaySlip.workingDays) * displaySlip.absentDays)}`
                    : undefined
                }
              />
              <SlipRow
                label="Unpaid Leave"
                value={`${displaySlip.unpaidLeaveDays} day${displaySlip.unpaidLeaveDays !== 1 ? "s" : ""}`}
                color={displaySlip.unpaidLeaveDays > 0 ? "red" : undefined}
                deduction={
                  displaySlip.unpaidLeaveDays > 0
                    ? `-${fmtINR((displaySlip.baseSalary / displaySlip.workingDays) * displaySlip.unpaidLeaveDays)}`
                    : undefined
                }
              />
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summary</p>
            </div>
            <div className="p-4 space-y-2">
              <SlipRow label="Gross Salary" value={fmtINR(displaySlip.baseSalary)} />
              <SlipRow
                label="Total Deductions"
                value={displaySlip.deductions > 0 ? `-${fmtINR(displaySlip.deductions)}` : "—"}
                color={displaySlip.deductions > 0 ? "red" : undefined}
              />
              <Separator />
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold">Net Salary</span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {fmtINR(displaySlip.netSalary)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Generated on{" "}
            {new Date(displaySlip.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Initial state */}
      {!initialLoaded && !loading && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Select a month and year, then click &quot;View Slip&quot;
        </div>
      )}
    </div>
  );
}
