import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { notFound, forbidden } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectDetailPage } from "@/components/projects/project-detail-page";

export const metadata: Metadata = { title: "Project Details" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "HR";

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      team: { select: { id: true, name: true } },
      manager: {
        select: { id: true, firstName: true, lastName: true, profileImage: true, designation: { select: { name: true } } },
      },
      createdBy: {
        select: { id: true, employee: { select: { firstName: true, lastName: true } } },
      },
      members: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, profileImage: true, designation: { select: { name: true } }, user: { select: { role: true } } },
          },
        },
      },
      managerHistory: {
        orderBy: { assignedAt: "desc" },
        include: {
          manager: {
            select: { id: true, firstName: true, lastName: true, profileImage: true, designation: { select: { name: true } } },
          },
          changedBy: {
            select: { id: true, employee: { select: { firstName: true, lastName: true } } },
          },
        },
      },
      weeklyTasks: {
        where: session.role === "EMPLOYEE" && session.employeeId
          ? { assignedToId: session.employeeId }
          : undefined,
        orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
          _count: { select: { dailyTasks: true } },
        },
      },
      workNotes: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        },
      },
      _count: { select: { members: true, weeklyTasks: true, workNotes: true } },
    },
  });

  if (!project) notFound();

  // Employees can only view projects they're a member of
  if (session.role === "EMPLOYEE" && session.employeeId) {
    const isMember = project.members.some((m) => m.employee.id === session.employeeId);
    if (!isMember) forbidden();
  }

  const allEmployees = isAdmin
    ? await prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, designation: { select: { name: true } } },
        orderBy: { firstName: "asc" },
      })
    : [];

  return (
    <ProjectDetailPage
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        deadline: project.deadline?.toISOString() ?? null,
        createdAt: project.createdAt.toISOString(),
        team: project.team ?? null,
        manager: project.manager
          ? {
              id: project.manager.id,
              name: `${project.manager.firstName} ${project.manager.lastName}`,
              designation: project.manager.designation?.name ?? null,
              profileImage: project.manager.profileImage,
            }
          : null,
        createdBy: project.createdBy.employee
          ? `${project.createdBy.employee.firstName} ${project.createdBy.employee.lastName}`
          : project.createdBy.id,
        members: project.members.map((m) => ({
          id: m.id,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          employee: {
            id: m.employee.id,
            name: `${m.employee.firstName} ${m.employee.lastName}`,
            designation: m.employee.designation?.name ?? null,
            profileImage: m.employee.profileImage,
            userRole: m.employee.user.role,
          },
        })),
        managerHistory: project.managerHistory.map((h) => ({
          id: h.id,
          assignedAt: h.assignedAt.toISOString(),
          removedAt: h.removedAt?.toISOString() ?? null,
          manager: {
            id: h.manager.id,
            name: `${h.manager.firstName} ${h.manager.lastName}`,
            designation: h.manager.designation?.name ?? null,
            profileImage: h.manager.profileImage,
          },
          changedBy: h.changedBy.employee
            ? `${h.changedBy.employee.firstName} ${h.changedBy.employee.lastName}`
            : h.changedBy.id,
        })),
        weeklyTasks: project.weeklyTasks.map((wt) => ({
          id: wt.id,
          title: wt.title,
          status: wt.status,
          progress: wt.progress,
          weekNumber: wt.weekNumber,
          year: wt.year,
          dueDate: wt.dueDate?.toISOString() ?? null,
          dailyTaskCount: wt._count.dailyTasks,
          assignedTo: {
            id: wt.assignedTo.id,
            name: `${wt.assignedTo.firstName} ${wt.assignedTo.lastName}`,
            profileImage: wt.assignedTo.profileImage,
          },
        })),
        workNotes: project.workNotes.map((n) => ({
          id: n.id,
          content: n.content,
          createdAt: n.createdAt.toISOString(),
          employee: {
            id: n.employee.id,
            name: `${n.employee.firstName} ${n.employee.lastName}`,
            profileImage: n.employee.profileImage,
          },
        })),
      }}
      allEmployees={allEmployees.map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        designation: e.designation?.name ?? null,
      }))}
      sessionRole={session.role}
      sessionEmployeeId={session.employeeId ?? null}
      isAdmin={isAdmin}
    />
  );
}
