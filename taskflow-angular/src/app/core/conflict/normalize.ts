import { mapProject, mapTask } from "../api/mappers";
import type { Project, ProjectRow, Task, TaskRow } from "../api/models";
import type { ProjectDraftValue, TaskDraftValue } from "../data/mutation-state";
import { normalizeDate, normalizeEstimate, normalizeSet } from "./diff";

export type TaskConflictDraft = TaskDraftValue & { archived?: boolean };
export type ProjectConflictDraft = ProjectDraftValue & { archived?: boolean };

export function taskToDraft(task: Task): TaskConflictDraft {
  return {
    title: task.title ?? "",
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    projectId: task.projectId ?? "",
    dueDate: normalizeDate(task.dueDate),
    estimate: normalizeEstimate(task.estimate),
    labels: [...(task.labels ?? [])],
    assigneeIds: task.assigneeId ? [task.assigneeId] : [],
    archived: task.archived,
  };
}

export function projectToDraft(project: Project): ProjectConflictDraft {
  return {
    name: project.name ?? "",
    description: project.description ?? "",
    dueDate: normalizeDate(project.dueDate),
    color: project.color ?? "",
    archived: project.archived,
  };
}

export function latestTaskFromUnknown(value: unknown): Task | null {
  if (!value || typeof value !== "object") return null;
  if ("project_id" in value) return mapTask(value as TaskRow);
  if ("projectId" in value && "title" in value) return value as Task;
  return null;
}

export function latestProjectFromUnknown(value: unknown): Project | null {
  if (!value || typeof value !== "object") return null;
  if ("workspace_id" in value) return mapProject(value as ProjectRow);
  if ("name" in value && "color" in value) return value as Project;
  return null;
}

export function payloadTouchedKeys(payload: Record<string, unknown>): Set<string> {
  const keys = new Set<string>();
  for (const key of Object.keys(payload)) {
    if (key === "expectedVersion") continue;
    if (key === "assigneeId") {
      keys.add("assigneeIds");
      continue;
    }
    keys.add(key);
  }
  return keys;
}

export function overlayTaskPayload(
  latest: TaskConflictDraft,
  payload: Record<string, unknown>,
): TaskConflictDraft {
  const next: TaskConflictDraft = {
    ...latest,
    labels: [...latest.labels],
    assigneeIds: [...latest.assigneeIds],
  };
  if (typeof payload["title"] === "string") next.title = payload["title"];
  if (typeof payload["description"] === "string") {
    next.description = payload["description"];
  }
  if (typeof payload["status"] === "string") {
    next.status = payload["status"] as TaskConflictDraft["status"];
  }
  if (typeof payload["priority"] === "string") {
    next.priority = payload["priority"] as TaskConflictDraft["priority"];
  }
  if (typeof payload["projectId"] === "string") next.projectId = payload["projectId"];
  if ("dueDate" in payload) {
    next.dueDate = normalizeDate(payload["dueDate"] as string | null);
  }
  if ("estimate" in payload) {
    next.estimate = normalizeEstimate(payload["estimate"] as number | null);
  }
  if (Array.isArray(payload["labels"])) {
    next.labels = [...(payload["labels"] as string[])];
  }
  if (Array.isArray(payload["assigneeIds"])) {
    next.assigneeIds = [...(payload["assigneeIds"] as string[])];
  } else if (typeof payload["assigneeId"] === "string") {
    next.assigneeIds = payload["assigneeId"] ? [payload["assigneeId"]] : [];
  }
  if (typeof payload["archived"] === "boolean") {
    next.archived = payload["archived"];
  }
  return next;
}

export function taskDraftToWriteBody(draft: TaskConflictDraft): {
  title: string;
  description: string;
  status: TaskConflictDraft["status"];
  priority: TaskConflictDraft["priority"];
  projectId: string;
  assigneeId: string | null;
  dueDate: string | null;
  labels: string[];
  estimate: number | null;
} {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    status: draft.status,
    priority: draft.priority,
    projectId: draft.projectId,
    assigneeId: draft.assigneeIds[0] ?? null,
    dueDate: normalizeDate(draft.dueDate) || null,
    labels: [...draft.labels],
    estimate: normalizeEstimate(draft.estimate),
  };
}

export function cloneTaskDraft(draft: TaskConflictDraft): TaskConflictDraft {
  return {
    ...draft,
    labels: [...draft.labels],
    assigneeIds: [...draft.assigneeIds],
  };
}

export function cloneProjectDraft(draft: ProjectConflictDraft): ProjectConflictDraft {
  return { ...draft };
}

export function assigneeIdsFromTask(task: Task): string[] {
  return normalizeSet(task.assigneeId ? [task.assigneeId] : []);
}
