"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";
import { formatDate } from "@/lib/utils/date";

interface Department {
  id: string;
  name: string;
  description: string | null;
  manager: { firstName: string; lastName: string } | null;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
}

interface DepartmentsListPageProps {
  departments: Department[];
}

export function DepartmentsListPage({ departments }: DepartmentsListPageProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const payload = { name: fd.get("name"), description: fd.get("description") };

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create department");
        return;
      }
      toast.success("Department created");
      setCreateOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Departments</h2>
          <p className="text-sm text-muted-foreground">{departments.length} departments</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-sm text-muted-foreground rounded-lg border">
            No departments yet
          </div>
        ) : (
          departments.map((dept) => (
            <div
              key={dept.id}
              className="rounded-lg border bg-card p-5 hover:border-foreground/20 transition-colors cursor-pointer"
              onClick={() => router.push(`/departments/${dept.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-sm">{dept.name}</h3>
                <Badge
                  variant="outline"
                  className={`text-xs ${dept.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-zinc-50 text-zinc-500 border-zinc-200"}`}
                >
                  {dept.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {dept.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{dept.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {dept.employeeCount} {dept.employeeCount === 1 ? "member" : "members"}
                </span>
                {dept.manager && (
                  <span>
                    Mgr: {dept.manager.firstName} {dept.manager.lastName}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
