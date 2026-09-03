import {
  STATUS_LABELS,
  type ActivityEventRow,
  type TaskPriority,
  type TaskStatus,
} from "../api/models";

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const FIELD_LABELS: Record<string, string> = {
  title: "title",
  description: "description",
  status: "status",
  priority: "priority",
  projectId: "project",
  dueDate: "due date",
  labels: "labels",
  estimate: "estimate",
  archived: "archive state",
};

export type FormattedHistory = {
  heading: string;
  detail: string;
};

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "none";
  if (key === "status" && typeof value === "string") {
    return STATUS_LABELS[value as TaskStatus] ?? value;
  }
  if (key === "priority" && typeof value === "string") {
    return PRIORITY_LABELS[value as TaskPriority] ?? value;
  }
  if (key === "archived") {
    return value ? "archived" : "not archived";
  }
  if (Array.isArray(value)) {
    return value.length ? value.map(String).join(", ") : "none";
  }
  if (typeof value === "object") return "updated";
  return String(value);
}

function describeChanges(changes: Record<string, unknown> | undefined): string | null {
  if (!changes) return null;
  const parts: string[] = [];
  for (const [key, raw] of Object.entries(changes)) {
    if (raw && typeof raw === "object" && "from" in raw && "to" in raw) {
      const value = raw as { from: unknown; to: unknown };
      const label = FIELD_LABELS[key] ?? key;
      parts.push(
        `${label} from ${formatValue(key, value.from)} to ${formatValue(key, value.to)}`,
      );
    }
  }
  return parts.length ? parts.join("; ") : null;
}

function knownHeading(action: string): string | null {
  switch (action) {
    case "created":
      return "Created";
    case "updated":
      return "Updated";
    case "moved":
      return "Moved";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
    case "restored":
      return "Restored";
    case "assigned":
      return "Assigned";
    case "unassigned":
      return "Unassigned";
    case "deleted":
      return "Deleted";
    case "commented":
      return "Comment added";
    case "comment_deleted":
      return "Comment deleted";
    case "attachment_added":
      return "Attachment added";
    case "attachment_removed":
      return "Attachment removed";
    default:
      return null;
  }
}

function knownDetail(
  event: ActivityEventRow,
  changes: string | null,
): string | null {
  switch (event.action) {
    case "created":
      return event.entity_title
        ? `Created “${event.entity_title}”.`
        : "Created this task.";
    case "moved":
      return changes
        ? `Moved this task (${changes}).`
        : event.summary || "Moved this task.";
    case "completed":
      return changes
        ? `Marked this task done (${changes}).`
        : "Marked this task as Done.";
    case "archived":
      return "Archived this task.";
    case "restored":
      return "Restored this task.";
    case "assigned":
      return event.summary || "Assigned this task.";
    case "unassigned":
      return event.summary || "Unassigned this task.";
    case "commented":
      return event.summary || "Added a comment.";
    case "comment_deleted":
      return event.summary || "Deleted a comment.";
    case "attachment_added":
      return event.summary || "Attached a file.";
    case "attachment_removed":
      return event.summary || "Removed an attachment.";
    case "updated":
      return changes
        ? `Updated ${changes}.`
        : event.summary || "Updated this task.";
    case "deleted":
      return event.summary || "Deleted this task.";
    default:
      return null;
  }
}

/**
 * Human-readable history/audit line. Unknown actions fall back to summary.
 * Does not invent events that the server did not return.
 */
export function formatHistoryEvent(
  event: ActivityEventRow,
  actorName?: string | null,
): FormattedHistory {
  const changes = describeChanges(event.changes);
  const heading = knownHeading(event.action) ?? event.action;
  const base =
    knownDetail(event, changes) ??
    changes ??
    event.summary ??
    "Updated this item.";
  const detail = actorName ? `${actorName} — ${base}` : base;
  return { heading, detail };
}
