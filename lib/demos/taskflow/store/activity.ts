import type {
  ActivityItem,
  Priority,
  Task,
  TaskStatus,
  TeamMember,
} from "@/lib/demos/taskflow/data";
import { formatDate } from "@/lib/demos/taskflow/utils";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export type ActivityDraft = Omit<ActivityItem, "id" | "timestamp"> & {
  id?: string;
  timestamp?: string;
};

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function pushActivity(
  activity: ActivityItem[],
  entry: ActivityDraft,
): ActivityItem[] {
  return [
    {
      id: entry.id ?? uid("a"),
      userId: entry.userId,
      action: entry.action,
      target: entry.target,
      timestamp: entry.timestamp ?? new Date().toISOString(),
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityTitle: entry.entityTitle,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      summary: entry.summary,
    },
    ...activity,
  ].slice(0, 100);
}

export function taskCreatedActivity(
  actorId: string,
  task: Task,
): ActivityDraft {
  return {
    userId: actorId,
    action: "created",
    target: task.title,
    entityType: "task",
    entityId: task.id,
    entityTitle: task.title,
    summary: `created ${task.title}`,
  };
}

export function taskMovedActivity(
  actorId: string,
  task: Task,
  from: TaskStatus,
  to: TaskStatus,
): ActivityDraft {
  if (to === "done") {
    return {
      userId: actorId,
      action: "completed",
      target: task.title,
      entityType: "task",
      entityId: task.id,
      entityTitle: task.title,
      oldValue: STATUS_LABELS[from],
      newValue: STATUS_LABELS[to],
      summary: `completed ${task.title}`,
    };
  }
  return {
    userId: actorId,
    action: "moved",
    target: task.title,
    entityType: "task",
    entityId: task.id,
    entityTitle: task.title,
    oldValue: STATUS_LABELS[from],
    newValue: STATUS_LABELS[to],
    summary: `moved ${task.title} from ${STATUS_LABELS[from]} to ${STATUS_LABELS[to]}`,
  };
}

export function taskDiffActivities(
  actorId: string,
  before: Task,
  after: Task,
  members: TeamMember[],
): ActivityDraft[] {
  const entries: ActivityDraft[] = [];
  const base = {
    userId: actorId,
    entityType: "task" as const,
    entityId: after.id,
    entityTitle: after.title,
  };

  if (before.status !== after.status) {
    entries.push(taskMovedActivity(actorId, after, before.status, after.status));
  }
  if (before.assigneeId !== after.assigneeId) {
    const name =
      members.find((member) => member.id === after.assigneeId)?.name ??
      after.assigneeId;
    entries.push({
      ...base,
      action: "assigned",
      target: after.title,
      oldValue:
        members.find((member) => member.id === before.assigneeId)?.name ??
        before.assigneeId,
      newValue: name,
      summary: `assigned ${after.title} to ${name}`,
    });
  }
  if (before.priority !== after.priority) {
    entries.push({
      ...base,
      action: "priority-changed",
      target: after.title,
      oldValue: PRIORITY_LABELS[before.priority],
      newValue: PRIORITY_LABELS[after.priority],
      summary: `changed priority on ${after.title} from ${PRIORITY_LABELS[before.priority]} to ${PRIORITY_LABELS[after.priority]}`,
    });
  }
  if (before.dueDate !== after.dueDate) {
    entries.push({
      ...base,
      action: "due-changed",
      target: after.title,
      oldValue: formatDate(before.dueDate),
      newValue: formatDate(after.dueDate),
      summary: `changed due date on ${after.title} from ${formatDate(before.dueDate)} to ${formatDate(after.dueDate)}`,
    });
  }
  if (before.projectId !== after.projectId) {
    entries.push({
      ...base,
      action: "project-changed",
      target: after.title,
      oldValue: before.projectId,
      newValue: after.projectId,
      summary: `moved ${after.title} to another project`,
    });
  }
  if (before.title !== after.title) {
    entries.push({
      ...base,
      action: "renamed",
      target: after.title,
      oldValue: before.title,
      newValue: after.title,
      summary: `renamed task from ${before.title} to ${after.title}`,
    });
  }
  if (
    before.description !== after.description &&
    entries.length === 0
  ) {
    entries.push({
      ...base,
      action: "updated",
      target: after.title,
      summary: `updated ${after.title}`,
    });
  }
  if (
    JSON.stringify(before.labels) !== JSON.stringify(after.labels) &&
    entries.length === 0
  ) {
    entries.push({
      ...base,
      action: "updated",
      target: after.title,
      summary: `updated labels on ${after.title}`,
    });
  }

  if (entries.length === 0) {
    entries.push({
      ...base,
      action: "updated",
      target: after.title,
      summary: `updated ${after.title}`,
    });
  }

  return entries;
}

export function formatActivityMessage(item: ActivityItem): string {
  if (item.summary) return item.summary;
  if (item.oldValue && item.newValue) {
    return `${item.action} ${item.entityTitle ?? item.target} from ${item.oldValue} to ${item.newValue}`;
  }
  if (item.newValue) {
    return `${item.action} ${item.entityTitle ?? item.target} → ${item.newValue}`;
  }
  return `${item.action} ${item.target}`;
}
