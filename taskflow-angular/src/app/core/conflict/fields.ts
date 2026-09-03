import type { TaskDraftValue, ProjectDraftValue } from "../data/mutation-state";
import {
  dateEqual,
  estimateEqual,
  setEqual,
  trimEqual,
  textEqual,
  scalarEqual,
  type DiffKind,
  type EqualFn,
} from "./diff";

export type TaskConflictField =
  | "title"
  | "description"
  | "status"
  | "priority"
  | "projectId"
  | "dueDate"
  | "estimate"
  | "labels"
  | "assigneeIds"
  | "archived";

export type ProjectConflictField =
  | "name"
  | "description"
  | "dueDate"
  | "color"
  | "archived";

export type ConflictFieldKey = TaskConflictField | ProjectConflictField;

export type FieldChoice = "local" | "server";

export type FieldDiff<T = unknown> = {
  key: ConflictFieldKey;
  label: string;
  kind: DiffKind;
  base: T;
  local: T;
  server: T;
  defaultResolved: T | undefined;
  choice: FieldChoice | null;
  override: T | undefined;
  resolved: T | undefined;
  editable: boolean;
};

export const TASK_FIELD_LABELS: Record<TaskConflictField, string> = {
  title: "Title",
  description: "Description",
  status: "Status",
  priority: "Priority",
  projectId: "Project",
  dueDate: "Due date",
  estimate: "Estimate",
  labels: "Labels",
  assigneeIds: "Assignees",
  archived: "Archived",
};

export const PROJECT_FIELD_LABELS: Record<ProjectConflictField, string> = {
  name: "Name",
  description: "Description",
  dueDate: "Due date",
  color: "Color",
  archived: "Archived",
};

export const TASK_COMPARE_FIELDS: TaskConflictField[] = [
  "title",
  "description",
  "status",
  "priority",
  "projectId",
  "dueDate",
  "estimate",
  "labels",
  "assigneeIds",
];

export const PROJECT_COMPARE_FIELDS: ProjectConflictField[] = [
  "name",
  "description",
  "dueDate",
  "color",
];

export function equalForTaskField(key: TaskConflictField): EqualFn<unknown> {
  switch (key) {
    case "title":
      return (a, b) => trimEqual(String(a ?? ""), String(b ?? ""));
    case "description":
      return (a, b) => textEqual(a as string, b as string);
    case "dueDate":
      return (a, b) => dateEqual(a as string, b as string);
    case "estimate":
      return (a, b) => estimateEqual(a as number | null, b as number | null);
    case "labels":
    case "assigneeIds":
      return (a, b) => setEqual(a as string[], b as string[]);
    case "archived":
      return (a, b) => Boolean(a) === Boolean(b);
    default:
      return (a, b) => scalarEqual(a, b);
  }
}

export function equalForProjectField(key: ProjectConflictField): EqualFn<unknown> {
  switch (key) {
    case "name":
      return (a, b) => trimEqual(String(a ?? ""), String(b ?? ""));
    case "description":
      return (a, b) => textEqual(a as string, b as string);
    case "dueDate":
      return (a, b) => dateEqual(a as string, b as string);
    case "archived":
      return (a, b) => Boolean(a) === Boolean(b);
    default:
      return (a, b) => scalarEqual(a, b);
  }
}

export function readTaskField(
  draft: TaskDraftValue & { archived?: boolean },
  key: TaskConflictField,
): unknown {
  if (key === "archived") return Boolean(draft.archived);
  return draft[key];
}

export function readProjectField(
  draft: ProjectDraftValue & { archived?: boolean },
  key: ProjectConflictField,
): unknown {
  if (key === "archived") return Boolean(draft.archived);
  return draft[key];
}

export function isTextField(key: ConflictFieldKey): boolean {
  return key === "title" || key === "name" || key === "description";
}
