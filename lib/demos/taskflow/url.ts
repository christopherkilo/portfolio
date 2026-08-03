"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEMO_BASE } from "@/lib/demos/taskflow/data";
import {
  formatCalendarMonth,
  normalizeDueFilter,
  normalizeIdFilter,
  normalizePriority,
  normalizeStatus,
  normalizeViewMode,
  parseCalendarMonth,
  type TaskFilters,
} from "@/lib/demos/taskflow/url-state";

export {
  formatCalendarMonth,
  matchesDueFilter,
  normalizeDueFilter,
  normalizeIdFilter,
  normalizePriority,
  normalizeStatus,
  normalizeViewMode,
  parseCalendarMonth,
  type DueFilter,
  type TaskFilters,
} from "@/lib/demos/taskflow/url-state";

/**
 * Bidirectional helpers for TaskFlow URL query state.
 * Invalid values are normalized; closing modals clears selection keys.
 */
export function useTaskflowUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setTaskId = useCallback(
    (taskId: string | null) => {
      replaceParams((params) => {
        if (!taskId) params.delete("task");
        else params.set("task", taskId);
      });
    },
    [replaceParams],
  );

  const setProjectId = useCallback(
    (projectId: string | null) => {
      replaceParams((params) => {
        if (!projectId) params.delete("project");
        else params.set("project", projectId);
      });
    },
    [replaceParams],
  );

  const setViewMode = useCallback(
    (mode: "board" | "list" | null) => {
      replaceParams((params) => {
        if (!mode || mode === "board") params.delete("view");
        else params.set("view", mode);
      });
    },
    [replaceParams],
  );

  const setFilter = useCallback(
    (filter: string | null) => {
      replaceParams((params) => {
        if (!filter) params.delete("q");
        else params.set("q", filter);
      });
    },
    [replaceParams],
  );

  const setCalendarMonth = useCallback(
    (month: string | null) => {
      replaceParams((params) => {
        if (!month) params.delete("month");
        else params.set("month", month);
      });
    },
    [replaceParams],
  );

  const setTaskFilters = useCallback(
    (patch: Partial<TaskFilters>) => {
      replaceParams((params) => {
        if ("q" in patch) {
          if (!patch.q) params.delete("q");
          else params.set("q", patch.q);
        }
        if ("projectId" in patch) {
          if (!patch.projectId || patch.projectId === "all")
            params.delete("projectFilter");
          else params.set("projectFilter", patch.projectId);
        }
        if ("assigneeId" in patch) {
          if (!patch.assigneeId || patch.assigneeId === "all")
            params.delete("assignee");
          else params.set("assignee", patch.assigneeId);
        }
        if ("priority" in patch) {
          if (!patch.priority || patch.priority === "all")
            params.delete("priority");
          else params.set("priority", patch.priority);
        }
        if ("status" in patch) {
          if (!patch.status || patch.status === "all") params.delete("status");
          else params.set("status", patch.status);
        }
        if ("due" in patch) {
          if (!patch.due || patch.due === "any") params.delete("due");
          else params.set("due", patch.due);
        }
        if ("label" in patch) {
          if (!patch.label || patch.label === "all") params.delete("label");
          else params.set("label", patch.label);
        }
        if ("overdueOnly" in patch) {
          if (!patch.overdueOnly) params.delete("overdue");
          else params.set("overdue", "1");
        }
      });
    },
    [replaceParams],
  );

  const clearTaskFilters = useCallback(() => {
    replaceParams((params) => {
      [
        "q",
        "projectFilter",
        "assignee",
        "priority",
        "status",
        "due",
        "label",
        "overdue",
      ].forEach((key) => params.delete(key));
    });
  }, [replaceParams]);

  const taskId = searchParams.get("task");
  const projectId = searchParams.get("project");
  const viewMode = normalizeViewMode(searchParams.get("view"));
  const filter = searchParams.get("q") ?? "";
  const monthParam = searchParams.get("month");
  const parsedMonth = parseCalendarMonth(monthParam);

  const taskFilters: TaskFilters = {
    q: filter,
    projectId: normalizeIdFilter(searchParams.get("projectFilter")),
    assigneeId: normalizeIdFilter(searchParams.get("assignee")),
    priority: normalizePriority(searchParams.get("priority")),
    status: normalizeStatus(searchParams.get("status")),
    due: normalizeDueFilter(searchParams.get("due")),
    label: normalizeIdFilter(searchParams.get("label")),
    overdueOnly: searchParams.get("overdue") === "1",
  };

  return {
    taskId,
    projectId,
    viewMode,
    filter,
    month: parsedMonth ? formatCalendarMonth(parsedMonth) : null,
    taskFilters,
    setTaskId,
    setProjectId,
    setViewMode,
    setFilter,
    setCalendarMonth,
    setTaskFilters,
    clearTaskFilters,
    tasksHref: (id: string) =>
      `${DEMO_BASE}/tasks?task=${encodeURIComponent(id)}`,
    projectsHref: (id: string) =>
      `${DEMO_BASE}/projects?project=${encodeURIComponent(id)}`,
  };
}
