import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TasksPage } from "@/components/tasks/tasks-page";
import { getTaskStats } from "@/services/task.service";

export const metadata: Metadata = { title: "Tasks" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; page?: string; assigneeRole?: string; search?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 15;

  const isSuperAdmin = session.role === RoleType.SUPER_ADMIN;
  const isHR = session.role === RoleType.HR;
  const isManager = session.role === RoleType.MANAGER;
  const canManage = isSuperAdmin || isHR || isManager;

  // Build task query filters
  const where: import("@prisma/client").Prisma.TaskWhereInput = {};

  // Non-managers only see their own tasks unless they can manage
  if (!canManage) {
    where.assignedToId = session.userId;
  }

  // Managers see tasks they created or assigned to employees in their managed dept
  if (isManager && session.employeeId) {
    where.OR = [
      { createdById: session.userId },
      { assignedTo: { employee: { department: { managerId: session.employeeId } } } },
    ];
  }

  if (params.status && params.status !== "all") {
    where.status = params.status as import("@prisma/client").TaskStatus;
  }
  if (params.priority && params.priority !== "all") {
    where.priority = params.priority as import("@prisma/client").TaskPriority;
  }
  if (params.assigneeRole && params.assigneeRole !== "all") {
    where.assignedTo = { role: params.assigneeRole as RoleType };
  }
  if (params.search) {
    where.title = { contains: params.search, mode: "insensitive" };
  }

  const [tasks, total, stats, assignableUsers] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            role: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
                department: { select: { name: true } },
              },
            },
          },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
    canManage ? getTaskStats() : Promise.resolve(null),
    canManage
      ? prisma.user.findMany({
          where: {
            ...(isSuperAdmin
              ? { role: { in: [RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE] } }
              : isHR
              ? { role: { in: [RoleType.MANAGER, RoleType.EMPLOYEE] } }
              : {}), // managers: handled separately
            employee: { status: "ACTIVE" },
          },
          select: {
            id: true,
            role: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
                department: { select: { name: true } },
                designation: { select: { name: true } },
              },
            },
          },
          orderBy: [{ role: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  return (
    <TasksPage
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        createdBy: {
          name: t.createdBy.employee
            ? `${t.createdBy.employee.firstName} ${t.createdBy.employee.lastName}`
            : t.createdBy.email,
        },
        assignedTo: t.assignedTo
          ? {
              name: t.assignedTo.employee
                ? `${t.assignedTo.employee.firstName} ${t.assignedTo.employee.lastName}`
                : t.assignedTo.email,
              role: t.assignedTo.role,
              department: t.assignedTo.employee?.department?.name ?? null,
            }
          : null,
        commentCount: t._count.comments,
      }))}
      total={total}
      page={page}
      totalPages={Math.ceil(total / limit)}
      canManage={canManage}
      isSuperAdmin={isSuperAdmin}
      stats={stats}
      assignableUsers={assignableUsers.map((u) => ({
        id: u.id,
        name: u.employee
          ? `${u.employee.firstName} ${u.employee.lastName}`
          : "Unknown",
        role: u.role,
        department: u.employee?.department?.name ?? null,
        designation: u.employee?.designation?.name ?? null,
      }))}
    />
  );
}
