"use client";

/** Task-domain Realtime tables (workspace-filtered). */
export const TASK_REALTIME_TABLES = [
  "tasks",
  "task_assignees",
  "task_attachments",
] as const;

export type TaskRealtimeEvent =
  | { kind: "task_changed"; taskId: string }
  | { kind: "assignees_changed"; taskId: string }
  | { kind: "attachment_changed"; taskId: string };
