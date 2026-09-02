import { prisma } from "@/lib/prisma";
import { CreateDailyTaskInput, UpdateDailyTaskInput, CreateChecklistItemInput } from "@/lib/validations/project";
import { recalculateWeeklyProgress } from "./weekly-task.service";

export async function listDailyTasks(weeklyTaskId: string) {
  return prisma.dailyTask.findMany({
    where: { weeklyTaskId },
    orderBy: { date: "asc" },
    include: { checklistItems: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getDailyTask(id: string) {
  return prisma.dailyTask.findUnique({
    where: { id },
    include: { checklistItems: { orderBy: { createdAt: "asc" } } },
  });
}

export async function createDailyTask(weeklyTaskId: string, input: CreateDailyTaskInput) {
  const task = await prisma.dailyTask.create({
    data: {
      weeklyTaskId,
      title: input.title,
      description: input.description,
      date: new Date(input.date),
      notes: input.notes,
      ...(input.status && { status: input.status }),
    },
  });
  await recalculateWeeklyProgress(weeklyTaskId);
  return task;
}

export async function updateDailyTask(id: string, input: UpdateDailyTaskInput) {
  const task = await prisma.dailyTask.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
  });
  await recalculateWeeklyProgress(task.weeklyTaskId);
  return task;
}

export async function deleteDailyTask(id: string) {
  const task = await prisma.dailyTask.findUnique({ where: { id } });
  if (!task) throw new Error("Daily task not found");
  await prisma.dailyTask.delete({ where: { id } });
  await recalculateWeeklyProgress(task.weeklyTaskId);
}

export async function listChecklistItems(dailyTaskId: string) {
  return prisma.checklistItem.findMany({
    where: { dailyTaskId },
    orderBy: { createdAt: "asc" },
  });
}

export async function addChecklistItem(dailyTaskId: string, input: CreateChecklistItemInput) {
  const item = await prisma.checklistItem.create({
    data: { dailyTaskId, text: input.text },
  });
  const task = await prisma.dailyTask.findUnique({ where: { id: dailyTaskId } });
  if (task) await recalculateWeeklyProgress(task.weeklyTaskId);
  return item;
}

export async function toggleChecklistItem(itemId: string) {
  const item = await prisma.checklistItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Checklist item not found");

  const updated = await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      isCompleted: !item.isCompleted,
      completedAt: !item.isCompleted ? new Date() : null,
    },
  });

  const task = await prisma.dailyTask.findUnique({ where: { id: item.dailyTaskId } });
  if (task) await recalculateWeeklyProgress(task.weeklyTaskId);

  return updated;
}

export async function deleteChecklistItem(itemId: string) {
  const item = await prisma.checklistItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Checklist item not found");
  await prisma.checklistItem.delete({ where: { id: itemId } });
  const task = await prisma.dailyTask.findUnique({ where: { id: item.dailyTaskId } });
  if (task) await recalculateWeeklyProgress(task.weeklyTaskId);
}
