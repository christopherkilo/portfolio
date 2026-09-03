import type { Project, Task, TaskPriority, TaskStatus } from "../api/models";

export type MutationPhase = "idle" | "submitting" | "error" | "conflict";

/**
 * Editor/mutation workflow conflict. Not UiStateService.
 * Stored on the editor that opened the draft so Phase 8 can merge later.
 */
export type VersionConflict<TEntity, TDraft> = {
  entityType: "task" | "project";
  entityId: string;
  expectedVersion: number;
  latest: TEntity;
  draft: TDraft;
  message: string;
};

export type TaskDraftValue = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  dueDate: string;
  estimate: number | null;
  labels: string[];
  assigneeIds: string[];
  archived?: boolean;
};

export type ProjectDraftValue = {
  name: string;
  description: string;
  dueDate: string;
  color: string;
  archived?: boolean;
};

export type TaskVersionConflict = VersionConflict<Task, TaskDraftValue>;
export type ProjectVersionConflict = VersionConflict<Project, ProjectDraftValue>;
