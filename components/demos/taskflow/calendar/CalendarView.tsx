"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import type { Task } from "@/lib/demos/taskflow/data";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { Modal } from "@/components/demos/taskflow/ui/Modal";
import {
  QueryErrorState,
  QueryLoadingState,
} from "@/components/demos/taskflow/shared/QueryStates";
import { cn, formatDate, todayDateOnly } from "@/lib/demos/taskflow/utils";
import { useWorkspaceData } from "@/lib/demos/taskflow/api/hooks";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import { useTaskflowUiStore } from "@/lib/demos/taskflow/store";
import {
  activeTasks,
  findMember,
  findProject,
  upcomingDeadlines,
} from "@/lib/demos/taskflow/store/selectors";
import {
  formatCalendarMonth,
  parseCalendarMonth,
  useTaskflowUrlState,
} from "@/lib/demos/taskflow/url";

export function CalendarView() {
  const {
    tasks,
    projects,
    members,
    workspaceId,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkspaceData();
  const weekStart = useTaskflowUiStore((state) => state.settings.weekStart);
  const { month, setCalendarMonth, tasksHref } = useTaskflowUrlState();

  const fallbackMonth = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, []);

  const cursor = parseCalendarMonth(month) ?? fallbackMonth;
  const [selected, setSelected] = useState<Task | null>(null);
  const today = todayDateOnly();
  const liveTasks = useMemo(() => activeTasks(tasks), [tasks]);

  useEffect(() => {
    if (!month) setCalendarMonth(formatCalendarMonth(fallbackMonth));
  }, [month, fallbackMonth, setCalendarMonth]);

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const label = cursor.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  function moveMonth(delta: number) {
    setCalendarMonth(
      formatCalendarMonth(new Date(year, monthIndex + delta, 1)),
    );
  }

  const cells = useMemo(() => {
    const first = new Date(year, monthIndex, 1);
    const startPad =
      weekStart === "monday" ? (first.getDay() + 6) % 7 : first.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const day = i - startPad + 1;
      if (day < 1 || day > daysInMonth) return null;
      const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayTasks = liveTasks.filter((task) => task.dueDate === iso);
      return { day, iso, dayTasks };
    });
  }, [year, monthIndex, weekStart, liveTasks]);

  const upcoming = useMemo(() => upcomingDeadlines(liveTasks, 6), [liveTasks]);
  const weekdays =
    weekStart === "monday"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (isLoading) return <QueryLoadingState label="Loading calendar…" />;
  if (isError) {
    const message =
      error instanceof TaskflowApiError ? error.message : undefined;
    return <QueryErrorState message={message} onRetry={() => void refetch()} />;
  }
  if (!workspaceId) {
    return (
      <QueryErrorState message="No workspace available. Create or join a workspace to view the calendar." />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
      <section className="min-w-0 rounded-xl border border-border bg-surface p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">{label}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setCalendarMonth(formatCalendarMonth(fallbackMonth))
              }
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <p className="mb-3 text-xs text-muted md:hidden">
          Swipe horizontally to view the full month.
        </p>
        <div className="scrollbar-thin overflow-x-auto pb-2">
          <div className="min-w-[680px]">
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-muted">
              {weekdays.map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => (
                <div
                  key={i}
                  className={cn(
                    "min-h-[96px] rounded-lg border bg-elevated/30 p-1.5",
                    cell?.iso === today
                      ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                      : "border-border/70",
                  )}
                >
                  {cell ? (
                    <>
                      <p
                        className={cn(
                          "text-xs text-muted",
                          cell.iso === today && "font-semibold text-accent",
                        )}
                      >
                        {cell.day}
                        {cell.iso === today ? (
                          <span className="sr-only">, today</span>
                        ) : null}
                      </p>
                      <ul className="mt-1 space-y-1">
                        {cell.dayTasks.slice(0, 2).map((task) => (
                          <li key={task.id}>
                            <button
                              type="button"
                              onClick={() => setSelected(task)}
                              className="min-h-7 w-full truncate rounded bg-accent/15 px-1 py-0.5 text-left text-[10px] text-accent hover:bg-accent/25"
                              title={task.title}
                            >
                              {task.title}
                            </button>
                          </li>
                        ))}
                        {cell.dayTasks.length > 2 ? (
                          <li className="px-1 text-[10px] font-medium text-muted">
                            +{cell.dayTasks.length - 2} more
                          </li>
                        ) : null}
                      </ul>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Upcoming deadlines</h2>
        <p className="mt-1 text-xs text-muted">
          Open tasks due today or later.
        </p>
        <ul className="mt-4 space-y-3">
          {upcoming.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => setSelected(task)}
                className="w-full rounded-lg border border-border bg-elevated/40 px-3 py-2.5 text-left hover:border-accent/30"
              >
                <p className="text-sm font-medium">{task.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {findProject(projects, task.projectId)?.name} ·{" "}
                  {formatDate(task.dueDate)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? "Deadline"}
      >
        {selected ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted">{selected.description}</p>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-elevated/50 p-3">
              <div>
                <dt className="text-xs text-muted">Due</dt>
                <dd className="mt-1">{formatDate(selected.dueDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Status</dt>
                <dd className="mt-1 capitalize">
                  {selected.status.replace("-", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Project</dt>
                <dd className="mt-1">
                  {findProject(projects, selected.projectId)?.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Assignee</dt>
                <dd className="mt-1">
                  {findMember(members, selected.assigneeId)?.name}
                </dd>
              </div>
            </dl>
            <Button className="w-full" href={tasksHref(selected.id)}>
              <CalendarClock className="size-4" /> Open on task board
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
