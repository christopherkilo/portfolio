import type { TaskPriority, TaskStatus } from "../api/models";

export type DueFilter = "any" | "today" | "week" | "overdue" | "none";

const STATUSES: TaskStatus[] = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const DUE_FILTERS: DueFilter[] = ["any", "today", "week", "overdue", "none"];

export function normalizeViewMode(value: string | null): "board" | "list" {
  return value === "list" ? "list" : "board";
}

export function normalizeStatus(value: string | null): TaskStatus | "all" {
  if (!value || value === "all") return "all";
  return STATUSES.includes(value as TaskStatus) ? (value as TaskStatus) : "all";
}

export function normalizePriority(value: string | null): TaskPriority | "all" {
  if (!value || value === "all") return "all";
  return PRIORITIES.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : "all";
}

export function normalizeDueFilter(value: string | null): DueFilter {
  if (!value) return "any";
  return DUE_FILTERS.includes(value as DueFilter) ? (value as DueFilter) : "any";
}

export function normalizeIdFilter(value: string | null): string | "all" {
  if (!value || value === "all") return "all";
  return value;
}

export type TaskFilters = {
  q: string;
  projectId: string | "all";
  assigneeId: string | "all";
  priority: TaskPriority | "all";
  status: TaskStatus | "all";
  due: DueFilter;
  label: string | "all";
  overdueOnly: boolean;
};

export function parseTaskFilters(params: {
  get(name: string): string | null;
}): TaskFilters {
  return {
    q: params.get("q") ?? "",
    projectId: normalizeIdFilter(params.get("projectFilter")),
    assigneeId: normalizeIdFilter(params.get("assignee")),
    priority: normalizePriority(params.get("priority")),
    status: normalizeStatus(params.get("status")),
    due: normalizeDueFilter(params.get("due")),
    label: normalizeIdFilter(params.get("label")),
    overdueOnly: params.get("overdue") === "1",
  };
}

export function matchesDueFilter(
  dueDate: string,
  status: string,
  due: DueFilter,
  today: string,
): boolean {
  if (due === "any") return true;
  if (due === "none") return !dueDate;
  if (due === "overdue") {
    return Boolean(dueDate) && status !== "done" && dueDate < today;
  }
  if (due === "today") return dueDate === today;
  if (due === "week") {
    if (!dueDate) return false;
    const end = new Date(`${today}T00:00:00`);
    end.setDate(end.getDate() + 7);
    const endIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    return status !== "done" && dueDate >= today && dueDate <= endIso;
  }
  return true;
}

export function taskFiltersAreActive(filters: TaskFilters): boolean {
  return (
    Boolean(filters.q) ||
    filters.projectId !== "all" ||
    filters.assigneeId !== "all" ||
    filters.priority !== "all" ||
    filters.status !== "all" ||
    filters.due !== "any" ||
    filters.label !== "all" ||
    filters.overdueOnly
  );
}
