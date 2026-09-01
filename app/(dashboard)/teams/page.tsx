import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { getTeams } from "@/services/team.service";
import { TeamsListPage } from "@/components/teams/teams-list-page";
import { RoleType } from "@prisma/client";

export const metadata: Metadata = { title: "Teams" };

export default async function TeamsPage() {
  const session = await requireAuth();
  const isManager = session.role === RoleType.MANAGER;

  const teams = await getTeams(
    isManager && session.employeeId
      ? { managerId: session.employeeId }
      : {}
  );

  return (
    <TeamsListPage
      teams={teams.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        members: t.members.map((m) => ({
          ...m,
          joinedAt: m.joinedAt.toISOString(),
        })),
      }))}
      role={session.role}
    />
  );
}
