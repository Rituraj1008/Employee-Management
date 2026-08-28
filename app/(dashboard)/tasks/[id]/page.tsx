import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { getTask } from "@/services/task.service";
import { prisma } from "@/lib/prisma";
import { TaskDetailPage } from "@/components/tasks/task-detail-page";
import { RoleType } from "@prisma/client";

export const metadata: Metadata = { title: "Task" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;

  try {
    const [task, assignableUsers] = await Promise.all([
      getTask(id),
      session.role !== RoleType.EMPLOYEE
        ? prisma.user.findMany({
            where: { employee: { status: "ACTIVE" } },
            select: {
              id: true,
              email: true,
              employee: { select: { firstName: true, lastName: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const canManage = session.role !== RoleType.EMPLOYEE;

    return (
      <TaskDetailPage
        task={{
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString() ?? null,
          createdAt: task.createdAt.toISOString(),
          createdBy: {
            id: task.createdBy.id,
            name: task.createdBy.employee
              ? `${task.createdBy.employee.firstName} ${task.createdBy.employee.lastName}`
              : task.createdBy.email,
          },
          assignedTo: task.assignedTo
            ? {
                id: task.assignedTo.id,
                name: task.assignedTo.employee
                  ? `${task.assignedTo.employee.firstName} ${task.assignedTo.employee.lastName}`
                  : task.assignedTo.email,
              }
            : null,
          comments: task.comments.map((c) => ({
            id: c.id,
            content: c.content,
            author: `${c.employee.firstName} ${c.employee.lastName}`,
            createdAt: c.createdAt.toISOString(),
          })),
        }}
        canManage={canManage}
        assignableUsers={assignableUsers.map((u) => ({
          id: u.id,
          name: u.employee
            ? `${u.employee.firstName} ${u.employee.lastName}`
            : u.email,
        }))}
        currentUserId={session.userId}
        employeeId={session.employeeId}
      />
    );
  } catch {
    notFound();
  }
}
