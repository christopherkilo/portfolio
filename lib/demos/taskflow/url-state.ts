import type { Priority, TaskStatus } from "@/lib/demos/taskflow/data";

export function parseCalendarMonth(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [y, m] = value.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return null;
  return new Date(y, m - 1, 1);
}

export function formatCalendarMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function normalizeViewMode(value: string | null): "board" | "list" {
  return value === "list" ? "list" : "board";
}

const STATUSES: TaskStatus[] = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
];
const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const DUE_FILTERS = ["any", "today", "week", "overdue", "none"] as const;
export type DueFilter = (typeof DUE_FILTERS)[number];

export function normalizeStatus(value: string | null): TaskStatus | "all" {
  if (!value || value === "all") return "all";
  return STATUSES.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : "all";
}

export function normalizePriority(value: string | null): Priority | "all" {
  if (!value || value === "all") return "all";
  return PRIORITIES.includes(value as Priority) ? (value as Priority) : "all";
}

export function normalizeDueFilter(value: string | null): DueFilter {
  if (!value) return "any";
  return (DUE_FILTERS as readonly string[]).includes(value)
    ? (value as DueFilter)
    : "any";
}

export function normalizeIdFilter(value: string | null): string | "all" {
  if (!value || value === "all") return "all";
  return value;
}

export type TaskFilters = {
  q: string;
  projectId: string | "all";
  assigneeId: string | "all";
  priority: Priority | "all";
  status: TaskStatus | "all";
  due: DueFilter;
  label: string | "all";
  overdueOnly: boolean;
};

export function matchesDueFilter(
  dueDate: string,
  status: string,
  due: DueFilter,
  today: string,
) {
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
