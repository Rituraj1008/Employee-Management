"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/date";
import {
  Banknote, Users, IndianRupee, Search, Pencil, Plus,
  Loader2, RefreshCw, Building2,
  Calendar, CheckCircle2,
  FileText, Eye,
} from "lucide-react";

/* ─── Types ─── */

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string | null;
  designation: string | null;
  joiningDate: string;
  salary: { id: string; baseSalary: number; effectiveFrom: string } | null;
}

interface SalarySlip {
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
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string | null;
    designation: string | null;
  };
}

interface PageStats {
  total: number;
  salarySet: number;
  totalPayroll: number;
}

interface SalaryPageProps {
  employees: Employee[];
  stats: PageStats;
}

/* ─── Style helpers ─── */

const ROLE_LABELS: Record<string, string> = {
  HR: "HR", MANAGER: "Manager", EMPLOYEE: "Employee",
};

const ROLE_STYLES: Record<string, string> = {
  HR: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  MANAGER: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EMPLOYEE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

/* ─── Main component ─── */

export function SalaryPage({ employees, stats }: SalaryPageProps) {
  const router = useRouter();
  const now = new Date();

  // Salary setup state
  const [search, setSearch] = useState("");
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [salaryInput, setSalaryInput] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [saving, setSaving] = useState(false);

  // Local salary values that update without full page reload
  const [localSalaries, setLocalSalaries] = useState<Record<string, { baseSalary: number; effectiveFrom: string }>>({});

  // Slips state
  const [slipMonth, setSlipMonth] = useState(now.getMonth() + 1);
  const [slipYear, setSlipYear] = useState(now.getFullYear());
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [slipsLoaded, setSlipsLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingSlips, setLoadingSlips] = useState(false);
  const [detailSlip, setDetailSlip] = useState<SalarySlip | null>(null);

  /* ── filtered employees ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        !q ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        (e.department?.toLowerCase().includes(q) ?? false)
    );
  }, [employees, search]);

  const displayedStats = useMemo(() => {
    const totals = employees.reduce(
      (acc, employee) => {
        const salary = localSalaries[employee.id] ?? employee.salary;

        if (salary) {
          acc.salarySet++;
          acc.totalPayroll += salary.baseSalary;
        }

        return acc;
      },
      { salarySet: 0, totalPayroll: 0 }
    );

    return { ...stats, ...totals };
  }, [employees, localSalaries, stats]);

  /* ── merged salary (local override > server) ── */
  function getSalary(emp: Employee) {
    return localSalaries[emp.id] ?? emp.salary;
  }

  /* ── Open set-salary dialog ── */
  function openEdit(emp: Employee) {
    const sal = getSalary(emp);
    setEditingEmp(emp);
    setSalaryInput(sal ? String(sal.baseSalary) : "");
    setEffectiveFrom(
      sal
        ? sal.effectiveFrom.split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
  }

  /* ── Save salary ── */
  async function handleSaveSalary() {
    if (!editingEmp) return;
    const val = parseFloat(salaryInput);
    if (!val || isNaN(val) || val <= 0) {
      toast.error("Enter a valid salary amount");
      return;
    }
    if (!effectiveFrom) {
      toast.error("Select an effective date");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/salary/${editingEmp.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseSalary: val, effectiveFrom }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to save"); return; }
      toast.success(`Salary set for ${editingEmp.firstName} ${editingEmp.lastName}`);
      setLocalSalaries((prev) => ({
        ...prev,
        [editingEmp.id]: { baseSalary: val, effectiveFrom },
      }));
      setEditingEmp(null);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  /* ── Load slips ── */
  async function loadSlips() {
    setLoadingSlips(true);
    try {
      const res = await fetch(`/api/salary/slips?month=${slipMonth}&year=${slipYear}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to load slips"); return; }
      setSlips(data.data);
      setSlipsLoaded(true);
    } catch {
      toast.error("Network error");
    } finally {
      setLoadingSlips(false);
    }
  }

  /* ── Generate slips ── */
  async function handleGenerate() {
    const withSalary = employees.filter((e) => getSalary(e) !== null);
    if (withSalary.length === 0) {
      toast.error("No employees have salary set. Set salaries first.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/salary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: slipMonth, year: slipYear }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Generation failed"); return; }
      toast.success(`Generated ${data.data.count} salary slip${data.data.count !== 1 ? "s" : ""}`);
      setSlips(data.data.slips);
      setSlipsLoaded(true);
    } catch {
      toast.error("Network error");
    } finally {
      setGenerating(false);
    }
  }

  function resetSelectedPeriod(nextMonth: number, nextYear: number) {
    setSlipMonth(nextMonth);
    setSlipYear(nextYear);
    setSlips([]);
    setSlipsLoaded(false);
    setDetailSlip(null);
  }

  const totalNetPayroll = slips.reduce((s, sl) => s + sl.netSalary, 0);
  const totalDeductions = slips.reduce((s, sl) => s + sl.deductions, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold">Salary Management</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Set employee salaries and generate monthly pay slips with attendance-based deductions
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Total Employees"
          value={String(displayedStats.total)}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Salaries Set"
          value={`${displayedStats.salarySet} / ${displayedStats.total}`}
          color="emerald"
        />
        <StatCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="Monthly Payroll"
          value={fmtINR(displayedStats.totalPayroll)}
          color="amber"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <Tabs defaultValue="setup">
        <TabsList className="h-8">
          <TabsTrigger value="setup" className="text-xs gap-1.5">
            <Banknote className="h-3.5 w-3.5" />
            Employee Salaries
          </TabsTrigger>
          <TabsTrigger value="slips" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Salary Slips
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Setup ── */}
        <TabsContent value="setup" className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative max-w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Search employees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">{filtered.length} employee{filtered.length !== 1 ? "s" : ""}</p>

          {/* Employee list */}
          <div className="space-y-2">
            {filtered.map((emp) => {
              const sal = getSalary(emp);
              return (
                <div
                  key={emp.id}
                  className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center shrink-0">
                    {initials(emp.firstName, emp.lastName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{emp.employeeCode}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_STYLES[emp.role] ?? ""}`}>
                        {ROLE_LABELS[emp.role] ?? emp.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {emp.department && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {emp.department}
                        </span>
                      )}
                      {emp.designation && <span>{emp.designation}</span>}
                    </div>
                  </div>

                  {/* Salary display */}
                  <div className="text-right shrink-0">
                    {sal ? (
                      <>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                          {fmtINR(sal.baseSalary)}
                        </p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Not set</p>
                    )}
                  </div>

                  {/* Action */}
                  <Button
                    size="sm"
                    variant={sal ? "outline" : "default"}
                    className="shrink-0 gap-1.5 h-7 text-xs"
                    onClick={() => openEdit(emp)}
                  >
                    {sal ? (
                      <><Pencil className="h-3 w-3" /> Edit</>
                    ) : (
                      <><Plus className="h-3 w-3" /> Set Salary</>
                    )}
                  </Button>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No employees match your search
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: Slips ── */}
        <TabsContent value="slips" className="mt-4 space-y-4">
          {/* Month/Year picker + actions */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 bg-card">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                className="text-sm bg-transparent border-0 outline-none pr-1"
                value={slipMonth}
                onChange={(e) => resetSelectedPeriod(Number(e.target.value), slipYear)}
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
              <select
                className="text-sm bg-transparent border-0 outline-none"
                value={slipYear}
                onChange={(e) => resetSelectedPeriod(slipMonth, Number(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={loadSlips} disabled={loadingSlips}>
              {loadingSlips ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
              View Slips
            </Button>

            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {generating ? "Generating…" : "Generate / Recalculate"}
            </Button>

            {slips.length > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {slips.length} slip{slips.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Slip summary cards */}
          {slipsLoaded && slips.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-emerald-50 dark:bg-emerald-950/20 p-4">
                <p className="text-xs text-muted-foreground">Total Net Payroll</p>
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                  {fmtINR(totalNetPayroll)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-red-50 dark:bg-red-950/20 p-4">
                <p className="text-xs text-muted-foreground">Total Deductions</p>
                <p className="text-lg font-semibold text-red-700 dark:text-red-400 mt-1">
                  {fmtINR(totalDeductions)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Slips Generated</p>
                <p className="text-lg font-semibold mt-1">{slips.length}</p>
              </div>
            </div>
          )}

          {/* Slips table */}
          {slipsLoaded && slips.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Employee</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2.5">Base</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5">Work Days</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5">Present</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5">Half Day</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5">Paid Leave</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5">Absent / Unpaid</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2.5">Deductions</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Net Salary</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {slips.map((slip) => {
                      const effectiveAbsent = slip.absentDays + slip.unpaidLeaveDays;
                      return (
                        <tr key={slip.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                                {initials(slip.employee.firstName, slip.employee.lastName)}
                              </div>
                              <div>
                                <p className="font-medium text-xs">
                                  {slip.employee.firstName} {slip.employee.lastName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-xs text-muted-foreground">{slip.employee.employeeCode}</span>
                                  <span className={`text-[10px] px-1 py-0.5 rounded-full font-medium ${ROLE_STYLES[slip.employee.role] ?? ""}`}>
                                    {ROLE_LABELS[slip.employee.role] ?? slip.employee.role}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-xs tabular-nums">{fmtINR(slip.baseSalary)}</td>
                          <td className="px-3 py-3 text-center text-xs tabular-nums">{slip.workingDays}</td>
                          <td className="px-3 py-3 text-center text-xs tabular-nums text-emerald-700 dark:text-emerald-400 font-medium">{slip.presentDays}</td>
                          <td className="px-3 py-3 text-center text-xs tabular-nums text-amber-700 dark:text-amber-400">{slip.halfDays}</td>
                          <td className="px-3 py-3 text-center text-xs tabular-nums text-blue-700 dark:text-blue-400">{slip.paidLeaveDays}</td>
                          <td className="px-3 py-3 text-center">
                            {effectiveAbsent > 0 ? (
                              <span className="text-xs tabular-nums text-red-700 dark:text-red-400 font-medium">{effectiveAbsent}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right text-xs tabular-nums text-red-700 dark:text-red-400">
                            {slip.deductions > 0 ? `-${fmtINR(slip.deductions)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              {fmtINR(slip.netSalary)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => setDetailSlip(slip)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Footer totals */}
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/20">
                      <td className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Total</td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums">
                        {fmtINR(slips.reduce((s, sl) => s + sl.baseSalary, 0))}
                      </td>
                      <td colSpan={5} />
                      <td className="px-3 py-2.5 text-right text-xs font-semibold text-red-700 dark:text-red-400 tabular-nums">
                        -{fmtINR(totalDeductions)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {fmtINR(totalNetPayroll)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {slipsLoaded && slips.length === 0 && (
            <div className="py-12 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No slips for {MONTH_NAMES[slipMonth - 1]} {slipYear}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Click &quot;Generate / Recalculate&quot; to create salary slips for this month
              </p>
              <Button size="sm" className="gap-1.5" onClick={handleGenerate} disabled={generating}>
                <RefreshCw className="h-3.5 w-3.5" />
                Generate Slips
              </Button>
            </div>
          )}

          {!slipsLoaded && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Select a month and year, then click &quot;View Slips&quot; or &quot;Generate / Recalculate&quot;
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Set Salary Dialog ── */}
      <Dialog open={!!editingEmp} onOpenChange={(open) => { if (!open) setEditingEmp(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingEmp?.salary || localSalaries[editingEmp?.id ?? ""]
                ? "Edit Salary"
                : "Set Salary"}
            </DialogTitle>
          </DialogHeader>

          {editingEmp && (
            <div className="space-y-4 py-1">
              {/* Employee info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center shrink-0">
                  {initials(editingEmp.firstName, editingEmp.lastName)}
                </div>
                <div>
                  <p className="text-sm font-medium">{editingEmp.firstName} {editingEmp.lastName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground">{editingEmp.employeeCode}</span>
                    {editingEmp.department && (
                      <span className="text-xs text-muted-foreground">· {editingEmp.department}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Base salary input */}
              <div className="space-y-1.5">
                <Label htmlFor="salaryAmt">
                  Monthly Base Salary (₹) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    id="salaryAmt"
                    type="number"
                    min={1}
                    step={500}
                    className="pl-7 text-sm"
                    placeholder="e.g. 50000"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Effective from */}
              <div className="space-y-1.5">
                <Label htmlFor="effectiveFrom">Effective From</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  className="text-sm"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </div>

              {/* Quick preview */}
              {salaryInput && Number(salaryInput) > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-1 text-xs">
                  <p className="font-medium text-muted-foreground">Preview</p>
                  <div className="flex justify-between">
                    <span>Monthly salary</span>
                    <span className="font-semibold">{fmtINR(Number(salaryInput))}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Daily rate (26 working days)</span>
                    <span>{fmtINR(Number(salaryInput) / 26)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Annual CTC</span>
                    <span>{fmtINR(Number(salaryInput) * 12)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingEmp(null)}>Cancel</Button>
            <Button onClick={handleSaveSalary} disabled={saving}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</> : "Save Salary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Slip Detail Sheet ── */}
      <Sheet open={!!detailSlip} onOpenChange={(open) => { if (!open) setDetailSlip(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
          {detailSlip && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle>Salary Slip</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {MONTH_NAMES[detailSlip.month - 1]} {detailSlip.year}
                </p>
              </SheetHeader>

              {/* Employee info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 mb-4">
                <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                  {initials(detailSlip.employee.firstName, detailSlip.employee.lastName)}
                </div>
                <div>
                  <p className="font-semibold">{detailSlip.employee.firstName} {detailSlip.employee.lastName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{detailSlip.employee.employeeCode}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_STYLES[detailSlip.employee.role] ?? ""}`}>
                      {ROLE_LABELS[detailSlip.employee.role] ?? detailSlip.employee.role}
                    </span>
                  </div>
                  {detailSlip.employee.department && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {detailSlip.employee.department}
                    </p>
                  )}
                </div>
              </div>

              {/* Earnings */}
              <div className="rounded-xl border border-border overflow-hidden mb-4">
                <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Earnings</p>
                </div>
                <div className="p-4 space-y-2">
                  <SlipRow label="Base Salary" value={fmtINR(detailSlip.baseSalary)} highlight />
                  <Separator />
                  <SlipRow label="Working Days in Month" value={String(detailSlip.workingDays)} />
                  <SlipRow label="Daily Rate" value={fmtINR(detailSlip.baseSalary / detailSlip.workingDays)} small />
                </div>
              </div>

              {/* Attendance breakdown */}
              <div className="rounded-xl border border-border overflow-hidden mb-4">
                <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attendance</p>
                </div>
                <div className="p-4 space-y-2">
                  <SlipRow
                    label="Present"
                    value={`${detailSlip.presentDays} day${detailSlip.presentDays !== 1 ? "s" : ""}`}
                    color="emerald"
                  />
                  <SlipRow
                    label="Half Day"
                    value={`${detailSlip.halfDays} day${detailSlip.halfDays !== 1 ? "s" : ""}`}
                    color="amber"
                    deduction={detailSlip.halfDays > 0 ? `-${fmtINR((detailSlip.baseSalary / detailSlip.workingDays) * 0.5 * detailSlip.halfDays)}` : undefined}
                  />
                  <SlipRow
                    label="Paid Leave (Approved)"
                    value={`${detailSlip.paidLeaveDays} day${detailSlip.paidLeaveDays !== 1 ? "s" : ""}`}
                    color="blue"
                  />
                  <SlipRow
                    label="Absent (No leave approved)"
                    value={`${detailSlip.absentDays} day${detailSlip.absentDays !== 1 ? "s" : ""}`}
                    color={detailSlip.absentDays > 0 ? "red" : undefined}
                    deduction={detailSlip.absentDays > 0 ? `-${fmtINR((detailSlip.baseSalary / detailSlip.workingDays) * detailSlip.absentDays)}` : undefined}
                  />
                  <SlipRow
                    label="Unpaid Leave (No approved leave)"
                    value={`${detailSlip.unpaidLeaveDays} day${detailSlip.unpaidLeaveDays !== 1 ? "s" : ""}`}
                    color={detailSlip.unpaidLeaveDays > 0 ? "red" : undefined}
                    deduction={detailSlip.unpaidLeaveDays > 0 ? `-${fmtINR((detailSlip.baseSalary / detailSlip.workingDays) * detailSlip.unpaidLeaveDays)}` : undefined}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summary</p>
                </div>
                <div className="p-4 space-y-2">
                  <SlipRow label="Gross Salary" value={fmtINR(detailSlip.baseSalary)} />
                  <SlipRow
                    label="Total Deductions"
                    value={detailSlip.deductions > 0 ? `-${fmtINR(detailSlip.deductions)}` : "—"}
                    color={detailSlip.deductions > 0 ? "red" : undefined}
                  />
                  <Separator />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-bold">Net Salary</span>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {fmtINR(detailSlip.netSalary)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Generated on {formatDate(detailSlip.createdAt)}
              </p>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({
  icon, label, value, color, className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "emerald" | "amber";
  className?: string;
}) {
  const styles = {
    blue:    { bg: "bg-blue-50 dark:bg-blue-950/30",      icon: "text-blue-500",    num: "text-blue-700 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-500", num: "text-emerald-700 dark:text-emerald-400" },
    amber:   { bg: "bg-amber-50 dark:bg-amber-950/30",    icon: "text-amber-500",   num: "text-amber-700 dark:text-amber-400" },
  }[color];

  return (
    <div className={`rounded-xl border border-border ${styles.bg} p-4 flex items-start gap-3 ${className ?? ""}`}>
      <div className={`mt-0.5 ${styles.icon}`}>{icon}</div>
      <div>
        <p className={`text-xl font-semibold tabular-nums ${styles.num}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SlipRow({
  label, value, highlight, small, color, deduction,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
  color?: "emerald" | "amber" | "blue" | "red";
  deduction?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-700 dark:text-emerald-400",
    amber:   "text-amber-700 dark:text-amber-400",
    blue:    "text-blue-700 dark:text-blue-400",
    red:     "text-red-700 dark:text-red-400",
  };
  const valueColor = color ? colorMap[color] : highlight ? "font-semibold" : "";

  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-xs ${small ? "text-muted-foreground" : ""}`}>{label}</span>
      <div className="flex items-center gap-2">
        {deduction && (
          <span className="text-xs text-red-600 dark:text-red-400">{deduction}</span>
        )}
        <span className={`text-xs tabular-nums ${valueColor}`}>{value}</span>
      </div>
    </div>
  );
}
