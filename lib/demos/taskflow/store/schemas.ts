import { z } from "zod";

export const taskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
]);

export const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const projectStatusSchema = z.enum([
  "active",
  "planning",
  "paused",
  "done",
]);

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000),
  status: taskStatusSchema,
  priority: prioritySchema,
  projectId: z.string().min(1),
  assigneeId: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  labels: z.array(z.string().trim().min(1).max(40)).max(8),
  estimate: z.number().min(0).max(400).optional(),
  archived: z.boolean().optional(),
});

export const taskDraftSchema = z.object({
  title: z.string().trim().min(1, "Enter a task title.").max(160),
  description: z.string().trim().max(2000).default(""),
  status: taskStatusSchema,
  priority: prioritySchema,
  projectId: z.string().min(1, "Choose a project."),
  assigneeId: z.string().min(1, "Choose an assignee."),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a due date."),
  labels: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  estimate: z.number().min(0).max(400).optional(),
});

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
  status: projectStatusSchema,
  progress: z.number().min(0).max(100),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  members: z.array(z.string().min(1)),
  color: z.string().min(1),
  taskCount: z.number().min(0),
  archived: z.boolean().optional(),
});

export const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  email: z.string().email(),
  avatar: z.string().min(1),
  status: z.enum(["online", "away", "offline"]),
});

export const activitySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  timestamp: z.string().min(1),
  entityType: z.enum(["task", "project", "member", "workspace"]).optional(),
  entityId: z.string().optional(),
  entityTitle: z.string().optional(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  summary: z.string().optional(),
});

export const settingsSchema = z.object({
  density: z.enum(["comfortable", "compact"]),
  emailNotifs: z.boolean(),
  pushNotifs: z.boolean(),
  weekStart: z.enum(["monday", "sunday"]),
  displayName: z.string().trim().min(1).max(80),
  email: z.string().email(),
});

export const persistedWorkspaceSchema = z.object({
  version: z.number().int().positive(),
  tasks: z.array(taskSchema),
  projects: z.array(projectSchema),
  members: z.array(memberSchema),
  activity: z.array(activitySchema),
  settings: settingsSchema,
});

export type TaskDraftInput = z.infer<typeof taskDraftSchema>;
export type PersistedWorkspace = z.infer<typeof persistedWorkspaceSchema>;
