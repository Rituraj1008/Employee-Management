import { prisma } from "@/lib/prisma";
import { TaskStatus, TaskPriority, Prisma } from "@prisma/client";
import { CreateTaskInput, UpdateTaskInput, CreateTaskCommentInput } from "@/lib/validations/task";

export async function listTasks(options: {
  assignedToId?: string;
  createdById?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
}) {
  const { assignedToId, createdById, status, priority, page = 1, limit = 20 } = options;

  const where: Prisma.TaskWhereInput = {
    ...(assignedToId ? { assignedToId } : {}),
    ...(createdById ? { createdById } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTask(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      comments: {
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!task) throw new Error("Task not found");
  return task;
}

export async function createTask(createdById: string, input: CreateTaskInput) {
  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      createdById,
      assignedToId: input.assignedToId || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");

  return prisma.task.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      assignedToId: input.assignedToId,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    },
  });
}

export async function addTaskComment(
  taskId: string,
  employeeId: string,
  input: CreateTaskCommentInput
) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  return prisma.taskComment.create({
    data: { taskId, employeeId, content: input.content },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getTaskStats() {
  const [todo, inProgress, inReview, completed] = await Promise.all([
    prisma.task.count({ where: { status: "TODO" } }),
    prisma.task.count({ where: { status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { status: "IN_REVIEW" } }),
    prisma.task.count({ where: { status: "COMPLETED" } }),
  ]);
  return { todo, inProgress, inReview, completed };
}
