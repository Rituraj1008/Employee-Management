import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { TeamForm } from "@/components/teams/team-form";
import { redirect } from "next/navigation";
import { RoleType } from "@prisma/client";

export const metadata: Metadata = { title: "New Team" };

export default async function NewTeamPage() {
  const session = await requireAuth();
  if (session.role !== RoleType.SUPER_ADMIN && session.role !== RoleType.HR) {
    redirect("/teams");
  }

  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: { select: { name: true } },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return <TeamForm employees={employees} />;
}
