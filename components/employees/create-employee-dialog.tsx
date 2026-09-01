"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Department {
  id: string;
  name: string;
}

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  onSuccess: () => void;
}

export function CreateEmployeeDialog({
  open,
  onOpenChange,
  departments,
  onSuccess,
}: CreateEmployeeDialogProps) {
  const [pending, setPending] = useState(false);
  const [selectedRole, setSelectedRole] = useState("EMPLOYEE");
  const [managedDeptIds, setManagedDeptIds] = useState<string[]>([]);

  function toggleDept(id: string) {
    setManagedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  function handleClose(open: boolean) {
    if (!open) {
      setSelectedRole("EMPLOYEE");
      setManagedDeptIds([]);
    }
    onOpenChange(open);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create employee");
        return;
      }

      const newEmployeeId: string = data.data?.id;

      // If creating a manager and departments selected, assign them
      if (selectedRole === "MANAGER" && managedDeptIds.length > 0 && newEmployeeId) {
        await Promise.all(
          managedDeptIds.map((deptId) =>
            fetch(`/api/departments/${deptId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ managerId: newEmployeeId }),
            })
          )
        );
      }

      toast.success("Employee created");
      handleClose(false);
      onSuccess();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  const isManager = selectedRole === "MANAGER";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Initial Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input id="joiningDate" name="joiningDate" type="date" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select name="departmentId">
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                name="role"
                defaultValue="EMPLOYEE"
                onValueChange={(v) => {
                  setSelectedRole(v);
                  setManagedDeptIds([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Manager department assignment */}
          {isManager && departments.length > 0 && (
            <div className="space-y-2">
              <Label>
                Manages Departments
                <span className="text-muted-foreground font-normal ml-1 text-xs">(select one or more)</span>
              </Label>
              <ScrollArea className="h-36 rounded-md border p-3">
                <div className="space-y-2">
                  {departments.map((d) => (
                    <div key={d.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`dept-${d.id}`}
                        checked={managedDeptIds.includes(d.id)}
                        onCheckedChange={() => toggleDept(d.id)}
                      />
                      <label
                        htmlFor={`dept-${d.id}`}
                        className="text-sm cursor-pointer select-none"
                      >
                        {d.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {managedDeptIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {managedDeptIds.length} department{managedDeptIds.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
