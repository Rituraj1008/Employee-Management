import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { notFound, forbidden } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WeeklyTaskPage } from "@/components/projects/weekly-task-page";

export const metadata: Metadata = { title: "Weekly Task" };

export default async function Page({ params }: { params: Promise<{ id: string; wtId: string }> }) {
  const session = await requireAuth();
  const { id: projectId, wtId } = await params;

  const weeklyTask = await prisma.weeklyTask.findUnique({
    where: { id: wtId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          deadline: true,
          // manager for "assigned by" display
          manager: { select: { firstName: true, lastName: true } },
        },
      },
      assignedTo: {
        select: { id: true, firstName: true, lastName: true, profileImage: true, designation: { select: { name: true } } },
      },
      dailyTasks: {
        orderBy: { date: "asc" },
        include: { checklistItems: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!weeklyTask) notFound();
  if (weeklyTask.projectId !== projectId) notFound();

  if (session.role === "EMPLOYEE" && weeklyTask.assignedToId !== session.employeeId) {
    forbidden();
  }

  const canManage =
    session.role === "SUPER_ADMIN" ||
    session.role === "HR" ||
    session.role === "MANAGER";

  const isAssignee = weeklyTask.assignedToId === session.employeeId;

  return (
    <WeeklyTaskPage
      weeklyTask={{
        id: weeklyTask.id,
        title: weeklyTask.title,
        description: weeklyTask.description,
        status: weeklyTask.status,
        progress: weeklyTask.progress,
        weekNumber: weeklyTask.weekNumber,
        managerRemark: weeklyTask.managerRemark,
        createdAt: weeklyTask.createdAt.toISOString(),
        project: {
          id: weeklyTask.project.id,
          name: weeklyTask.project.name,
          createdAt: weeklyTask.project.createdAt.toISOString(),
          deadline: weeklyTask.project.deadline?.toISOString() ?? null,
          managerName: weeklyTask.project.manager
            ? `${weeklyTask.project.manager.firstName} ${weeklyTask.project.manager.lastName}`
            : null,
        },
        assignedTo: {
          id: weeklyTask.assignedTo.id,
          name: `${weeklyTask.assignedTo.firstName} ${weeklyTask.assignedTo.lastName}`,
          designation: weeklyTask.assignedTo.designation?.name ?? null,
          profileImage: weeklyTask.assignedTo.profileImage,
        },
        dailyTasks: weeklyTask.dailyTasks.map((dt) => ({
          id: dt.id,
          title: dt.title,
          description: dt.description,
          date: dt.date.toISOString(),
          status: dt.status,
          notes: dt.notes,
          checklistItems: dt.checklistItems.map((c) => ({
            id: c.id,
            text: c.text,
            isCompleted: c.isCompleted,
            completedAt: c.completedAt?.toISOString() ?? null,
          })),
        })),
      }}
      canManage={canManage}
      isAssignee={isAssignee}
    />
  );
}
