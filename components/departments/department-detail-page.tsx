"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil } from "lucide-react";
import { RoleType } from "@prisma/client";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "HR",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

interface DepartmentDetailPageProps {
  department: {
    id: string;
    name: string;
    description: string | null;
    manager: { id: string; firstName: string; lastName: string } | null;
    isActive: boolean;
    employees: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: RoleType;
      designation: string | null;
    }[];
  };
  allEmployees: { id: string; firstName: string; lastName: string }[];
}

export function DepartmentDetailPage({ department, allEmployees }: DepartmentDetailPageProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch(`/api/departments/${department.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Update failed");
        return;
      }
      toast.success("Department updated");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  async function handleToggleActive() {
    try {
      const res = await fetch(`/api/departments/${department.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !department.isActive }),
      });
      if (!res.ok) {
        toast.error("Failed to update");
        return;
      }
      toast.success(department.isActive ? "Department deactivated" : "Department activated");
      router.refresh();
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
          <h2 className="text-base font-semibold">{department.name}</h2>
          <p className="text-sm text-muted-foreground">{department.employees.length} members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleActive}>
            {department.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button size="sm" onClick={() => setEditing(!editing)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} className="rounded-lg border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input name="name" defaultValue={department.name} required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea name="description" defaultValue={department.description || ""} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Manager</Label>
            <Select name="managerId" defaultValue={department.manager?.id || ""}>
              <SelectTrigger><SelectValue placeholder="Select manager…" /></SelectTrigger>
              <SelectContent>
                {allEmployees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-muted-foreground w-32 shrink-0">Description</span>
            <span className="text-sm">{department.description || "—"}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-muted-foreground w-32 shrink-0">Manager</span>
            <span className="text-sm">
              {department.manager
                ? `${department.manager.firstName} ${department.manager.lastName}`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-muted-foreground w-32 shrink-0">Status</span>
            <Badge
              variant="outline"
              className={`text-xs ${department.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-zinc-50 text-zinc-500 border-zinc-200"}`}
            >
              {department.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      )}

      {/* Members */}
      <div>
        <h3 className="text-sm font-medium mb-3">Members</h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Name</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Designation</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {department.employees.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted-foreground py-8 px-4">
                    No members
                  </td>
                </tr>
              ) : (
                department.employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {emp.designation || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className="text-xs">
                        {ROLE_LABELS[emp.role]}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
