import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(120),
  description: z.string().max(1000).optional(),
  teamId: z.string().uuid("Select a team"),
  deadline: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  deadline: z.string().optional().nullable(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"]).optional(),
});

export const changeManagerSchema = z.object({
  managerId: z.string().uuid("Invalid manager ID"),
});

export const createWeeklyTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  assignedToId: z.string().uuid("Invalid assignee"),
  weekNumber: z.number().int().min(1).max(53),
  year: z.number().int().min(2020).max(2100),
  dueDate: z.string().optional(),
});

export const updateWeeklyTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  assignedToId: z.string().uuid().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"]).optional(),
  dueDate: z.string().optional().nullable(),
  managerRemark: z.string().max(1000).optional().nullable(),
});

export const createDailyTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"]).optional(),
});

export const updateDailyTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"]).optional(),
  notes: z.string().max(2000).optional(),
});

export const createChecklistItemSchema = z.object({
  text: z.string().min(1, "Checklist item cannot be empty").max(500),
});

export const createWorkNoteSchema = z.object({
  content: z.string().min(1, "Note cannot be empty").max(3000),
});

export type CreateProjectInput  = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ChangeManagerInput = z.infer<typeof changeManagerSchema>;
export type CreateWeeklyTaskInput = z.infer<typeof createWeeklyTaskSchema>;
export type UpdateWeeklyTaskInput = z.infer<typeof updateWeeklyTaskSchema>;
export type CreateDailyTaskInput = z.infer<typeof createDailyTaskSchema>;
export type UpdateDailyTaskInput = z.infer<typeof updateDailyTaskSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type CreateWorkNoteInput = z.infer<typeof createWorkNoteSchema>;
