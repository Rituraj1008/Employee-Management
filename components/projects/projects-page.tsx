"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  FolderKanban, Plus, Calendar, Users, CheckSquare,
  ArrowRight, Loader2, Search, UsersRound, UserCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils/date";

/* ── Types ── */

interface TeamMemberRef { id: string; name: string; designation: string | null }
interface TeamRef {
  id: string;
  name: string;
  manager: { id: string; name: string; designation: string | null } | null;
  members: TeamMemberRef[];
}

interface Project {
  id: string; name: string; description: string | null; status: string;
  deadline: string | null;
  team: { id: string; name: string } | null;
  manager: { id: string; name: string; profileImage: string | null } | null;
  memberCount: number; taskCount: number; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ON_HOLD:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLETED:"bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};
const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning", ACTIVE: "Active", ON_HOLD: "On Hold", COMPLETED: "Completed",
};

export function ProjectsPage({
  projects, teams, canCreate, role,
}: {
  projects: Project[];
  teams: TeamRef[];
  canCreate: boolean;
  role: string;
}) {
  const router = useRouter();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creating, setCreating]       = useState(false);
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [form, setForm] = useState({ name: "", description: "", deadline: "" });

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openDialog() {
    setSelectedTeamId("");
    setForm({ name: "", description: "", deadline: "" });
    setDialogOpen(true);
  }

  async function handleCreate() {
    if (!form.name.trim()) { toast.error("Project name is required"); return; }
    if (!selectedTeamId)   { toast.error("Select a team to assign"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          teamId: selectedTeamId,
          deadline: form.deadline || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to create project"); return; }
      toast.success("Project created and assigned to team");
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role === "EMPLOYEE" ? "Projects you're part of" : "All active and upcoming projects"}
          </p>
        </div>
        {canCreate && (
          <Button onClick={openDialog} className="gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No projects found</p>
          {canCreate && (
            <Button variant="outline" className="mt-4 gap-2" onClick={openDialog}>
              <Plus className="h-4 w-4" /> Create your first project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderKanban className="h-[18px] w-[18px] text-primary" />
                  </div>
                  <p className="font-semibold text-sm leading-tight truncate">{p.name}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </div>

              {p.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {p.team && (
                  <span className="flex items-center gap-1 font-medium text-foreground/70">
                    <UsersRound className="h-3.5 w-3.5" /> {p.team.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {p.memberCount}
                </span>
                <span className="flex items-center gap-1">
                  <CheckSquare className="h-3.5 w-3.5" /> {p.taskCount}
                </span>
                {p.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {formatDate(p.deadline)}
                  </span>
                )}
              </div>

              {p.manager && (
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Manager: <span className="font-medium text-foreground">{p.manager.name}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Team selector — required */}
            <div className="space-y-1.5">
              <Label>
                Assign to Team <span className="text-destructive">*</span>
              </Label>
              {teams.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-3">
                  No active teams yet. Create a team first, then come back to assign a project.
                </p>
              ) : (
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team…" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        {t.manager ? ` — ${t.manager.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Team preview — shown once a team is selected */}
            {selectedTeam && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5 text-sm">
                {selectedTeam.manager && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      Manager:{" "}
                      <span className="font-medium text-foreground">{selectedTeam.manager.name}</span>
                      {selectedTeam.manager.designation && (
                        <span className="text-muted-foreground"> — {selectedTeam.manager.designation}</span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-foreground">{selectedTeam.members.length} member{selectedTeam.members.length !== 1 ? "s" : ""}</span>
                    {selectedTeam.members.length > 0 && (
                      <p className="text-xs mt-0.5">
                        {selectedTeam.members.map((m) => m.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70 pt-0.5">
                  The team manager becomes the project manager and all members are added automatically.
                </p>
              </div>
            )}

            {/* Project name */}
            <div className="space-y-1.5">
              <Label>Project Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Website Redesign Q3"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the project…"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !selectedTeamId || !form.name.trim()}
            >
              {creating
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</>
                : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
