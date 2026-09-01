import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { getTeamById } from "@/services/team.service";
import { prisma } from "@/lib/prisma";
import { TeamDetailPage } from "@/components/teams/team-detail-page";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;

  const [team, employees] = await Promise.all([
    getTeamById(id),
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designation: { select: { name: true } },
        user: { select: { email: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  if (!team) notFound();

  return (
    <TeamDetailPage
      team={{
        ...team,
        createdAt: team.createdAt.toISOString(),
        members: team.members.map((m) => ({
          ...m,
          joinedAt: m.joinedAt.toISOString(),
        })),
      }}
      allEmployees={employees}
      role={session.role}
    />
  );
}
