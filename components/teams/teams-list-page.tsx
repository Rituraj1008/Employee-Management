"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Plus, Crown, Pencil, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleType } from "@prisma/client";

interface Member {
  id: string;
  employeeId: string;
  employee: { firstName: string; lastName: string };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  managerId: string | null;
  manager: { id: string; firstName: string; lastName: string; designation: { name: string } | null } | null;
  members: Member[];
  _count: { members: number };
  createdAt: string;
}

interface TeamsListPageProps {
  teams: Team[];
  role: RoleType;
}

const canAdmin = (role: RoleType) =>
  role === RoleType.SUPER_ADMIN || role === RoleType.HR;

export function TeamsListPage({ teams: initial, role }: TeamsListPageProps) {
  const [teams, setTeams] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete team "${name}"? This will remove all members.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to delete team"); return; }
      setTeams((prev) => prev.filter((t) => t.id !== id));
      toast.success("Team deleted");
    } catch { toast.error("Network error"); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Teams</h2>
          <p className="text-sm text-muted-foreground">{teams.length} team{teams.length !== 1 ? "s" : ""}</p>
        </div>
        {canAdmin(role) && (
          <Button asChild size="sm">
            <Link href="/teams/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New Team
            </Link>
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="rounded-lg border bg-card py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">No teams yet</p>
          {canAdmin(role) && (
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/teams/new" className="underline underline-offset-2">Create a team</Link> to get started
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="rounded-lg border bg-card overflow-hidden flex flex-col">
              <div className="px-5 py-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold truncate">{team.name}</h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          team.isActive
                            ? "text-green-700 border-green-200 bg-green-50 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900"
                            : "text-zinc-500 border-zinc-200 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                        }`}
                      >
                        {team.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {team.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{team.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    {team.manager ? (
                      <span className="truncate font-medium text-foreground">
                        {team.manager.firstName} {team.manager.lastName}
                        {team.manager.designation && (
                          <span className="font-normal text-muted-foreground"> · {team.manager.designation.name}</span>
                        )}
                      </span>
                    ) : (
                      <span className="italic">No manager assigned</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>{team._count.members} member{team._count.members !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between">
                <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                  <Link href={`/teams/${team.id}`}>View Team</Link>
                </Button>
                {canAdmin(role) && (
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link href={`/teams/${team.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(team.id, team.name)}
                      disabled={deletingId === team.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
