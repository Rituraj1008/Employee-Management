import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { getTeamById } from "@/services/team.service";
import { prisma } from "@/lib/prisma";
import { TeamForm } from "@/components/teams/team-form";
import { notFound, redirect } from "next/navigation";
import { RoleType } from "@prisma/client";

export const metadata: Metadata = { title: "Edit Team" };

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (session.role !== RoleType.SUPER_ADMIN && session.role !== RoleType.HR) {
    redirect("/teams");
  }

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
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  if (!team) notFound();

  return (
    <TeamForm
      employees={employees}
      defaultValues={{
        name: team.name,
        description: team.description ?? undefined,
        managerId: team.managerId,
        isActive: team.isActive,
      }}
      teamId={team.id}
      isEdit
    />
  );
}
