"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Crown, UserCheck, Plus, Trash2, Pencil, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils/date";
import { RoleType } from "@prisma/client";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  designation: { name: string } | null;
  user: { email: string };
}

interface Member {
  id: string;
  employeeId: string;
  joinedAt: string;
  employee: Employee & { employeeCode: string };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  managerId: string | null;
  manager: (Employee & { employeeCode: string }) | null;
  members: Member[];
  _count: { members: number };
  createdAt: string;
}

interface TeamDetailPageProps {
  team: Team;
  allEmployees: Employee[];
  role: RoleType;
}

const canAdmin = (role: RoleType) =>
  role === RoleType.SUPER_ADMIN || role === RoleType.HR;
const canManage = (role: RoleType) =>
  role === RoleType.SUPER_ADMIN || role === RoleType.HR || role === RoleType.MANAGER;

export function TeamDetailPage({ team: initial, allEmployees, role }: TeamDetailPageProps) {
  const [team, setTeam]         = useState(initial);
  const [addingEmp, setAddingEmp] = useState("");
  const [adding, setAdding]     = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();

  const memberIds = new Set(team.members.map((m) => m.employeeId));
  const available = allEmployees.filter((e) => !memberIds.has(e.id));

  async function handleAddMember() {
    if (!addingEmp) { toast.error("Select an employee first"); return; }
    setAdding(true);
    try {
      const res  = await fetch(`/api/teams/${team.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: addingEmp }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to add member"); return; }
      setTeam((prev) => ({
        ...prev,
        members: [...prev.members, data.data],
        _count: { members: prev._count.members + 1 },
      }));
      setAddingEmp("");
      toast.success("Member added");
    } catch { toast.error("Network error"); }
    finally { setAdding(false); }
  }

  async function handleRemoveMember(employeeId: string, name: string) {
    if (!window.confirm(`Remove ${name} from this team?`)) return;
    setRemovingId(employeeId);
    try {
      const res  = await fetch(`/api/teams/${team.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to remove member"); return; }
      setTeam((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.employeeId !== employeeId),
        _count: { members: prev._count.members - 1 },
      }));
      toast.success("Member removed");
    } catch { toast.error("Network error"); }
    finally { setRemovingId(null); }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/teams"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold">{team.name}</h2>
              <Badge
                variant="outline"
                className={`text-xs ${
                  team.isActive
                    ? "text-green-700 border-green-200 bg-green-50"
                    : "text-zinc-500 border-zinc-200 bg-zinc-50"
                }`}
              >
                {team.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {team.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{team.description}</p>
            )}
          </div>
        </div>
        {canAdmin(role) && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/teams/${team.id}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h3 className="text-sm font-medium">Team Info</h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Manager</p>
                {team.manager ? (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Crown className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {team.manager.firstName} {team.manager.lastName}
                      </p>
                      {team.manager.designation && (
                        <p className="text-xs text-muted-foreground truncate">
                          {team.manager.designation.name}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No manager assigned</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Members</p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                <p className="text-sm">{formatDate(team.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Team Members
              </h3>
              <span className="text-xs text-muted-foreground">{team._count.members}</span>
            </div>

            {canManage(role) && (
              <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
                <Select value={addingEmp} onValueChange={setAddingEmp}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue placeholder="Select employee to add…" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">All employees added</div>
                    ) : (
                      available.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="text-xs">
                          {emp.firstName} {emp.lastName}
                          {emp.designation ? ` — ${emp.designation.name}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 text-xs shrink-0" onClick={handleAddMember} disabled={adding || !addingEmp}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
            )}

            {team.members.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No members yet
              </div>
            ) : (
              <ul className="divide-y">
                {team.members.map((m) => {
                  const isManager = m.employeeId === team.managerId;
                  return (
                    <li key={m.id} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                          isManager
                            ? "bg-amber-100 text-amber-700"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {m.employee.firstName[0]}{m.employee.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">
                              {m.employee.firstName} {m.employee.lastName}
                            </p>
                            {isManager && (
                              <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {m.employee.designation?.name || m.employee.employeeCode}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {formatDate(m.joinedAt)}
                        </span>
                        {canManage(role) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveMember(m.employeeId, `${m.employee.firstName} ${m.employee.lastName}`)}
                            disabled={removingId === m.employeeId}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
