"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils/date";
import { Plus, Search } from "lucide-react";
import { CreateEmployeeDialog } from "./create-employee-dialog";
import { RoleType } from "@prisma/client";

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleType;
  department: string | null;
  designation: string | null;
  status: string;
  joiningDate: string;
}

interface Department {
  id: string;
  name: string;
}

interface EmployeesListPageProps {
  employees: Employee[];
  total: number;
  page: number;
  totalPages: number;
  departments: Department[];
}

const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "HR",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

export function EmployeesListPage({
  employees,
  total,
  page,
  totalPages,
  departments,
}: EmployeesListPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  function updateSearch(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => router.push(`/employees?${params.toString()}`));
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/employees?${params.toString()}`);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Employees</h2>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search employees…"
            defaultValue={searchParams.get("search") || ""}
            className="pl-8 h-8 text-sm"
            onChange={(e) => updateSearch("search", e.target.value)}
          />
        </div>
        <Select
          defaultValue={searchParams.get("department") || "all"}
          onValueChange={(v) => updateSearch("department", v)}
        >
          <SelectTrigger className="h-8 text-sm w-auto min-w-36">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          defaultValue={searchParams.get("status") || "all"}
          onValueChange={(v) => updateSearch("status", v)}
        >
          <SelectTrigger className="h-8 text-sm w-auto min-w-28">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Employee</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Code</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Department</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Role</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Joined</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-12 px-4">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => router.push(`/employees/${emp.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {emp.employeeCode}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {emp.department || <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {ROLE_LABELS[emp.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(emp.joiningDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          emp.status === "ACTIVE"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200"
                        }`}
                      >
                        {emp.status.charAt(0) + emp.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                Previous
              </Button>
              <Button size="sm" variant="outline" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateEmployeeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        departments={departments}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
