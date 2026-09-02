import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { ProjectsPage } from "@/components/projects/projects-page";

export const metadata: Metadata = { title: "Projects" };

export default async function Page() {
  const session = await requireAuth();

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "HR";
  const isManager = session.role === "MANAGER";

  const where: Record<string, unknown> = {};
  if (session.role === "EMPLOYEE" && session.employeeId) {
    where.members = { some: { employeeId: session.employeeId } };
  }
  if (isManager && session.employeeId) {
    where.managerId = session.employeeId;
  }

  const [projects, teams] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        team: { select: { id: true, name: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true, profileImage: true },
        },
        _count: { select: { members: true, weeklyTasks: true } },
      },
    }),
    // Only admins can create projects; fetch teams for the create dialog
    isAdmin
      ? prisma.team.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: {
            manager: {
              select: { id: true, firstName: true, lastName: true, designation: { select: { name: true } } },
            },
            members: {
              include: {
                employee: {
                  select: { id: true, firstName: true, lastName: true, designation: { select: { name: true } } },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <ProjectsPage
      projects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        deadline: p.deadline?.toISOString() ?? null,
        team: p.team ?? null,
        manager: p.manager
          ? { id: p.manager.id, name: `${p.manager.firstName} ${p.manager.lastName}`, profileImage: p.manager.profileImage }
          : null,
        memberCount: p._count.members,
        taskCount: p._count.weeklyTasks,
        createdAt: p.createdAt.toISOString(),
      }))}
      teams={teams.map((t) => ({
        id: t.id,
        name: t.name,
        manager: t.manager
          ? { id: t.manager.id, name: `${t.manager.firstName} ${t.manager.lastName}`, designation: t.manager.designation?.name ?? null }
          : null,
        members: t.members.map((m) => ({
          id: m.employee.id,
          name: `${m.employee.firstName} ${m.employee.lastName}`,
          designation: m.employee.designation?.name ?? null,
        })),
      }))}
      canCreate={isAdmin}
      role={session.role}
    />
  );
}
