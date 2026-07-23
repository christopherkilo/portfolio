"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  TASKS,
  TASK_COLUMNS,
  getMember,
  getProject,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/demos/taskflow/data";
import { Modal } from "@/components/demos/taskflow/ui/Modal";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { formatDate, cn } from "@/lib/demos/taskflow/utils";
import { springHover } from "@/lib/demos/taskflow/animation";

const priorityStyles: Record<Priority, string> = {
  low: "bg-subtle-strong text-muted",
  medium: "bg-accent/15 text-accent",
  high: "bg-warning/15 text-warning",
  urgent: "bg-danger/15 text-danger",
};

export function TasksView() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState(TASKS);
  const [query, setQuery] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("task"),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const requestedTask = searchParams.get("task");

  const selected = useMemo(
    () => tasks.find((t) => t.id === selectedId) ?? null,
    [tasks, selectedId],
  );

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((task) => {
      const project = getProject(task.projectId);
      return (
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.labels.some((label) => label.toLowerCase().includes(q)) ||
        (project?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [tasks, query]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("taskflow-tasks") ?? "null");
      if (
        Array.isArray(stored) &&
        stored.length >= TASKS.length &&
        TASKS.every((source) =>
          stored.some((task: Task) => task.id === source.id),
        )
      ) {
        queueMicrotask(() => setTasks(stored));
      }
    } catch {
      // Ignore malformed local demo state.
    }
  }, []);

  useEffect(() => {
    if (requestedTask) {
      queueMicrotask(() => setSelectedId(requestedTask));
    }
  }, [requestedTask]);

  function updateTasks(update: (current: Task[]) => Task[]) {
    setTasks((current) => {
      const next = update(current);
      localStorage.setItem("taskflow-tasks", JSON.stringify(next));
      return next;
    });
  }

  function setStatus(id: string, status: TaskStatus) {
    updateTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, status } : task)),
    );
  }

  function addTemporaryTask() {
    const title = draftTitle.trim();
    if (!title) return;
    const task: Task = {
      id: `temp-${Date.now()}`,
      title,
      description: "Temporary demo task — resets after a full refresh if storage is cleared.",
      status: "backlog",
      priority: "medium",
      projectId: "p1",
      assigneeId: "u1",
      dueDate: new Date().toISOString().slice(0, 10),
      labels: ["demo"],
    };
    updateTasks((current) => [task, ...current]);
    setDraftTitle("");
    setSelectedId(task.id);
  }

  function onDrop(status: TaskStatus) {
    if (!dragId) return;
    setStatus(dragId, status);
    setDragId(null);
    setDropTarget(null);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Drag cards between columns or use each card’s status control. Filter and
        temporary tasks stay client-side for this demo session.
      </p>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/60 p-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-xs text-muted">
          Filter tasks
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, labels, or project"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm text-ink"
          />
        </label>
        <label className="min-w-0 flex-1 text-xs text-muted">
          Add temporary task
          <input
            type="text"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTemporaryTask();
              }
            }}
            placeholder="Quick capture title"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm text-ink"
          />
        </label>
        <Button
          type="button"
          onClick={addTemporaryTask}
          disabled={!draftTitle.trim()}
          className="h-10 shrink-0"
        >
          Add task
        </Button>
      </div>

      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
        {TASK_COLUMNS.map((column) => {
          const columnTasks = filteredTasks.filter((t) => t.status === column.id);
          return (
            <section
              key={column.id}
              className={cn(
                "w-[280px] shrink-0 rounded-xl border bg-surface/60 transition",
                dropTarget === column.id
                  ? "border-accent bg-accent/10 ring-2 ring-accent/20"
                  : "border-border",
              )}
              onDragEnter={() => dragId && setDropTarget(column.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(column.id);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDropTarget(null);
                }
              }}
              onDrop={() => onDrop(column.id)}
              aria-label={`${column.label} column`}
            >
              <header className="flex items-center justify-between border-b border-border px-3 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {column.label}
                </h2>
                <span className="rounded-md bg-subtle px-1.5 py-0.5 text-[11px] text-muted">
                  {columnTasks.length}
                </span>
              </header>
              <ul className="space-y-2 p-3" data-density-list>
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={() => setSelectedId(task.id)}
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropTarget(null);
                    }}
                    onStatusChange={(status) => setStatus(task.id, status)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.title ?? "Task"}
      >
        {selected ? <TaskDetail task={selected} /> : null}
        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={() => setSelectedId(null)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function TaskCard({
  task,
  onOpen,
  onDragStart,
  onDragEnd,
  onStatusChange,
}: {
  task: Task;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const assignee = getMember(task.assigneeId);
  const project = getProject(task.projectId);

  return (
    <motion.li
      whileHover={{ y: -2 }}
      transition={springHover}
      className="rounded-lg border border-border bg-elevated p-3 transition hover:border-accent/30"
      data-density-card
    >
      <article
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="min-h-11 flex-1 text-left text-sm font-medium leading-snug hover:text-accent"
          >
            {task.title}
          </button>
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize",
              priorityStyles[task.priority],
            )}
          >
            {task.priority}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">{project?.name}</p>
        <label className="mt-3 block text-xs text-muted">
          <span className="sr-only">Status for {task.title}</span>
          <select
            value={task.status}
            onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
            onPointerDown={(event) => event.stopPropagation()}
            className="h-10 w-full rounded-lg border border-border bg-surface px-2 text-xs capitalize text-ink"
            aria-label={`Change status for ${task.title}`}
          >
            {TASK_COLUMNS.map((column) => (
              <option key={column.id} value={column.id}>{column.label}</option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {task.labels.slice(0, 2).map((label) => (
              <span
                key={label}
                className="rounded bg-subtle px-1.5 py-0.5 text-[10px] text-muted"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span>{formatDate(task.dueDate)}</span>
            <span
              className="inline-flex size-6 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent"
              title={assignee?.name}
            >
              {assignee?.avatar}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 min-h-11 w-full rounded-lg border border-border text-xs font-medium text-accent hover:bg-accent/10"
        >
          View details
        </button>
      </article>
    </motion.li>
  );
}

function TaskDetail({ task }: { task: Task }) {
  const assignee = getMember(task.assigneeId);
  const project = getProject(task.projectId);

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">{task.description}</p>
      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-elevated/50 p-3">
        <div>
          <dt className="text-xs text-muted">Status</dt>
          <dd className="mt-1 capitalize">{task.status.replace("-", " ")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Priority</dt>
          <dd className="mt-1 capitalize">{task.priority}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Project</dt>
          <dd className="mt-1">{project?.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Assignee</dt>
          <dd className="mt-1">{assignee?.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Due</dt>
          <dd className="mt-1">{formatDate(task.dueDate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Labels</dt>
          <dd className="mt-1">{task.labels.join(", ")}</dd>
        </div>
      </dl>
    </div>
  );
}
