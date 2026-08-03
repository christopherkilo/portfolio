import { z } from "zod";

export const workspaceRoleSchema = z.enum([
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const projectStatusSchema = z.enum([
  "active",
  "planning",
  "paused",
  "done",
]);

export const taskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
]);

export const taskPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Enter a workspace name.").max(120),
  description: z.string().trim().max(1000).optional().default(""),
});

export const renameWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Enter a workspace name.").max(120),
});

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1, "Enter a project name.").max(120),
  description: z.string().trim().max(1000).optional().default(""),
  status: projectStatusSchema.optional().default("planning"),
  color: z.string().min(1).max(32).optional().default("#60A5FA"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  status: projectStatusSchema.optional(),
  color: z.string().min(1).max(32).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  archived: z.boolean().optional(),
  expectedVersion: z.number().int().positive(),
});

export const createTaskSchema = z.object({
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().trim().min(1, "Enter a task title.").max(160),
  description: z.string().trim().max(2000).optional().default(""),
  status: taskStatusSchema.optional().default("backlog"),
  priority: taskPrioritySchema.optional().default("medium"),
  assigneeId: z.string().uuid().nullable().optional(),
  assigneeIds: z.array(z.string().uuid()).max(20).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  labels: z.array(z.string().trim().min(1).max(40)).max(8).optional().default([]),
  estimate: z.number().min(0).max(400).nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  labels: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  estimate: z.number().min(0).max(400).nullable().optional(),
  archived: z.boolean().optional(),
  expectedVersion: z.number().int().positive(),
});

export const listProjectsQuerySchema = z.object({
  workspaceId: z.string().uuid(),
});

export const listTasksQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Enter a comment.").max(4000),
});

export const updateCommentSchema = z.object({
  body: z.string().trim().min(1, "Enter a comment.").max(4000),
});

export const createInvitationSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(320),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(20).max(200),
});

export const assignTaskSchema = z.object({
  userId: z.string().uuid(),
});

export const initiateAttachmentSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum([
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/pdf",
    "text/plain",
  ]),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

export const completeAttachmentSchema = z.object({
  attachmentId: z.string().uuid(),
});

export const notificationPreferencesSchema = z.object({
  assignments: z.boolean().optional(),
  comments: z.boolean().optional(),
  mentions: z.boolean().optional(),
  dueDates: z.boolean().optional(),
  projectChanges: z.boolean().optional(),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type InitiateAttachmentInput = z.infer<typeof initiateAttachmentSchema>;
export type CompleteAttachmentInput = z.infer<typeof completeAttachmentSchema>;
export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
