import { STATUS_LABELS, type TaskPriority, type TaskStatus } from "../api/models";
import { formatDate } from "../data/dates";
import type { FieldDiff } from "./fields";

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function formatDiffValue(
  diff: FieldDiff,
  side: "local" | "server" | "resolved",
  names?: { members?: Record<string, string>; projects?: Record<string, string> },
): string {
  const value =
    side === "local" ? diff.local : side === "server" ? diff.server : diff.resolved;
  return formatFieldValue(diff.key, value, names);
}

export function formatFieldValue(
  key: string,
  value: unknown,
  names?: { members?: Record<string, string>; projects?: Record<string, string> },
): string {
  if (value === undefined || value === null || value === "") return "None";
  switch (key) {
    case "status":
      return STATUS_LABELS[value as TaskStatus] ?? String(value);
    case "priority":
      return PRIORITY_LABELS[value as TaskPriority] ?? String(value);
    case "dueDate":
      return formatDate(String(value));
    case "estimate":
      return `${value}h`;
    case "labels":
      return Array.isArray(value) && value.length ? value.join(", ") : "None";
    case "assigneeIds":
      if (!Array.isArray(value) || value.length === 0) return "None";
      return value
        .map((id) => names?.members?.[String(id)] ?? String(id))
        .join(", ");
    case "projectId":
      return names?.projects?.[String(value)] ?? String(value);
    case "archived":
      return value ? "Archived" : "Not archived";
    default:
      return String(value);
  }
}

export function kindLabel(kind: FieldDiff["kind"]): string {
  switch (kind) {
    case "LOCAL_ONLY":
      return "Kept your change";
    case "SERVER_ONLY":
      return "Kept the latest version";
    case "BOTH_SAME":
      return "Both made the same change";
    case "CONFLICTING":
      return "Needs a decision";
    default:
      return "Unchanged";
  }
}
