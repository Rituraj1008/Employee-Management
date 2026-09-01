"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  designation: { name: string } | null;
}

interface TeamFormProps {
  employees: Employee[];
  defaultValues?: {
    name?: string;
    description?: string;
    managerId?: string | null;
    isActive?: boolean;
  };
  teamId?: string;
  isEdit?: boolean;
}

export function TeamForm({ employees, defaultValues, teamId, isEdit }: TeamFormProps) {
  const router = useRouter();
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [managerId, setManagerId] = useState(defaultValues?.managerId ?? "");
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Team name is required"); return; }

    setSaving(true);
    try {
      const url  = isEdit ? `/api/teams/${teamId}` : "/api/teams";
      const method = isEdit ? "PATCH" : "POST";
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          managerId: managerId || null,
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to save team"); return; }
      toast.success(isEdit ? "Team updated" : "Team created");
      router.push(`/teams/${data.data.id}`);
      router.refresh();
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={isEdit ? `/teams/${teamId}` : "/teams"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-base font-semibold">{isEdit ? "Edit Team" : "Create Team"}</h2>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Update team details" : "Set up a new project team"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Team Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product Squad, Backend Team"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this team's purpose"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manager">Team Manager</Label>
            <Select value={managerId || "none"} onValueChange={(v) => setManagerId(v === "none" ? "" : v)}>
              <SelectTrigger id="manager">
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No manager —</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                    {emp.designation ? ` (${emp.designation.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={isActive ? "active" : "inactive"} onValueChange={(v) => setIsActive(v === "active")}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Team"}
          </Button>
        </div>
      </form>
    </div>
  );
}
