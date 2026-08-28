import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { listTasks } from "@/services/task.service";
import { prisma } from "@/lib/prisma";
import { TasksPage } from "@/components/tasks/tasks-page";

export const metadata: Metadata = { title: "Tasks" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const canManage =
    session.role === RoleType.SUPER_ADMIN ||
    session.role === RoleType.HR ||
    session.role === RoleType.MANAGER;

  const [data, assignableUsers] = await Promise.all([
    listTasks({
      assignedToId: canManage ? undefined : session.userId,
      status: params.status as "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | undefined,
      priority: params.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined,
      page,
      limit: 20,
    }),
    canManage
      ? prisma.user.findMany({
          where: { employee: { status: "ACTIVE" } },
          select: {
            id: true,
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
          orderBy: { email: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <TasksPage
      tasks={data.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        createdBy: t.createdBy.employee
          ? { name: `${t.createdBy.employee.firstName} ${t.createdBy.employee.lastName}` }
          : { name: t.createdBy.email },
        assignedTo: t.assignedTo?.employee
          ? { name: `${t.assignedTo.employee.firstName} ${t.assignedTo.employee.lastName}` }
          : t.assignedTo
          ? { name: t.assignedTo.email }
          : null,
        commentCount: t._count.comments,
      }))}
      total={data.total}
      page={page}
      totalPages={data.totalPages}
      canManage={canManage}
      assignableUsers={assignableUsers.map((u) => ({
        id: u.id,
        name: u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : u.email,
      }))}
    />
  );
}
