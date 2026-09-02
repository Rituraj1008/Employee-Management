import { prisma } from "@/lib/prisma";
import { CreateWeeklyTaskInput, UpdateWeeklyTaskInput } from "@/lib/validations/project";

export async function listWeeklyTasks(projectId: string, filters?: { assignedToId?: string; weekNumber?: number; year?: number }) {
  return prisma.weeklyTask.findMany({
    where: {
      projectId,
      ...(filters?.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters?.weekNumber && { weekNumber: filters.weekNumber }),
      ...(filters?.year && { year: filters.year }),
    },
    orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true, profileImage: true },
      },
      _count: { select: { dailyTasks: true } },
    },
  });
}

export async function getWeeklyTask(id: string) {
  return prisma.weeklyTask.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true, profileImage: true, designation: { select: { name: true } } },
      },
      dailyTasks: {
        orderBy: { date: "asc" },
        include: {
          checklistItems: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
}

export async function createWeeklyTask(projectId: string, input: CreateWeeklyTaskInput) {
  return prisma.weeklyTask.create({
    data: {
      projectId,
      title: input.title,
      description: input.description,
      assignedToId: input.assignedToId,
      weekNumber: input.weekNumber,
      year: input.year,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    },
  });
}

export async function updateWeeklyTask(id: string, input: UpdateWeeklyTaskInput) {
  return prisma.weeklyTask.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.assignedToId !== undefined && { assignedToId: input.assignedToId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      }),
      ...(input.managerRemark !== undefined && { managerRemark: input.managerRemark }),
    },
  });
}

export async function deleteWeeklyTask(id: string) {
  return prisma.weeklyTask.delete({ where: { id } });
}

// Progress = completed days / 6. Auto-sets weekly status when all days done.
export async function recalculateWeeklyProgress(weeklyTaskId: string) {
  const dailyTasks = await prisma.dailyTask.findMany({ where: { weeklyTaskId } });

  const completedDays = dailyTasks.filter((dt) => dt.status === "COMPLETED").length;
  const progress = Math.round((completedDays / 6) * 100);

  const autoStatus =
    completedDays === 6 ? "COMPLETED" :
    completedDays > 0  ? "IN_PROGRESS" : "TODO";

  await prisma.weeklyTask.update({
    where: { id: weeklyTaskId },
    data: { progress, status: autoStatus },
  });
}
