"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/date";
import { ArrowLeft, Pencil, UserX } from "lucide-react";
import { RoleType } from "@prisma/client";

const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "HR",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

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
}

export function EmployeeDetailPage({ employee, departments, designations }: EmployeeDetailPageProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Update failed");
        return;
      }
      toast.success("Employee updated");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  async function handleDeactivate() {
    if (!confirm("Deactivate this employee?")) return;
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to deactivate");
        return;
      }
      toast.success("Employee deactivated");
      router.push("/employees");
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-base font-semibold">
            {employee.firstName} {employee.lastName}
          </h2>
          <p className="text-sm text-muted-foreground">{employee.employeeCode}</p>
        </div>
        <div className="flex gap-2">
          {employee.status === "ACTIVE" && (
            <Button variant="outline" size="sm" onClick={handleDeactivate}>
              <UserX className="h-3.5 w-3.5 mr-1.5" />
              Deactivate
            </Button>
          )}
          <Button size="sm" onClick={() => setEditing(!editing)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      {!editing ? (
        <div className="rounded-lg border bg-card divide-y">
          {[
            { label: "Email", value: employee.email },
            { label: "Phone", value: employee.phone || "—" },
            { label: "Department", value: employee.department?.name || "—" },
            { label: "Designation", value: employee.designation?.name || "—" },
            { label: "Role", value: ROLE_LABELS[employee.role] },
            { label: "Joining Date", value: formatDate(employee.joiningDate) },
            {
              label: "Status",
              value: (
                <Badge
                  variant="outline"
                  className={`text-xs ${employee.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-200" : "bg-zinc-50 text-zinc-500 border-zinc-200"}`}
                >
                  {employee.status.charAt(0) + employee.status.slice(1).toLowerCase()}
                </Badge>
              ),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
              <span className="text-sm font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="rounded-lg border bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input name="firstName" defaultValue={employee.firstName} required />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input name="lastName" defaultValue={employee.lastName} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input name="phone" defaultValue={employee.phone || ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select name="departmentId" defaultValue={employee.department?.id || ""}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Select name="designationId" defaultValue={employee.designation?.id || ""}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
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
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
