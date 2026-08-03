"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  TASK_COLUMNS,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/demos/taskflow/data";
import { Modal } from "@/components/demos/taskflow/ui/Modal";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { EmptyState } from "@/components/demos/taskflow/ui/EmptyState";
import {
  QueryErrorState,
  QueryLoadingState,
} from "@/components/demos/taskflow/shared/QueryStates";
import { TaskComments } from "@/components/demos/taskflow/comments/TaskComments";
import { TaskAttachments } from "@/components/demos/taskflow/attachments/TaskAttachments";
import { TaskHistoryPanel } from "@/components/demos/taskflow/audit/TaskHistoryPanel";
import { EntityPresenceLine } from "@/components/demos/taskflow/collaboration/PresenceAvatars";
import { TaskEditorModal } from "@/components/demos/taskflow/tasks/TaskEditorModal";
import { taskflowRealtimeManager } from "@/lib/demos/taskflow/realtime/RealtimeManager";
import { formatDate, cn, todayDateOnly } from "@/lib/demos/taskflow/utils";
import { springHover } from "@/lib/demos/taskflow/animation";
import {
  useDeleteTaskMutation,
  useTaskflowMe,
  useUpdateTaskMutation,
  useWorkspaceData,
} from "@/lib/demos/taskflow/api/hooks";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import type { WorkspaceRole } from "@/server/taskflow/types/database";
import {
  activeTasks,
  findMember,
  findProject,
} from "@/lib/demos/taskflow/store/selectors";
import { STATUS_LABELS } from "@/lib/demos/taskflow/store/activity";
import {
  matchesDueFilter,
  useTaskflowUrlState,
} from "@/lib/demos/taskflow/url";
import { useCompletionBurst } from "@/lib/demos/taskflow/shortcuts";

const priorityStyles: Record<Priority, string> = {
  low: "bg-subtle-strong text-muted",
  medium: "bg-accent/15 text-accent",
  high: "bg-warning/15 text-warning",
  urgent: "bg-danger/15 text-danger",
};

export function TasksView() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const me = useTaskflowMe();
  const updateTask = useUpdateTaskMutation(workspaceId);
  const deleteTask = useDeleteTaskMutation(workspaceId);
  const currentUserId = me.data?.id ?? null;
  const myRole = (members.find((member) => member.id === currentUserId)?.role ??
    "viewer") as WorkspaceRole;
  const canComment =
    myRole === "owner" || myRole === "admin" || myRole === "member";
  const reduced = useReducedMotion();
  const { burst, celebrate } = useCompletionBurst();

  const {
    taskId,
    viewMode,
    taskFilters,
    setTaskId,
    setViewMode,
    setTaskFilters,
    clearTaskFilters,
  } = useTaskflowUrlState();

  const [createOpen, setCreateOpen] = useState(
    () => searchParams.get("create") === "1",
  );
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const [announce, setAnnounce] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const createFromUrl = searchParams.get("create") === "1";
  const editorOpen = createOpen || createFromUrl;

  const liveTasks = useMemo(() => activeTasks(tasks), [tasks]);
  const today = todayDateOnly();
  const labels = useMemo(() => {
    const set = new Set<string>();
    liveTasks.forEach((task) => task.labels.forEach((label) => set.add(label)));
    return [...set].sort();
  }, [liveTasks]);

  const selected = useMemo(
    () => (taskId ? liveTasks.find((task) => task.id === taskId) ?? null : null),
    [liveTasks, taskId],
  );

  useEffect(() => {
    if (taskId && !liveTasks.some((task) => task.id === taskId)) {
      setTaskId(null);
    }
  }, [taskId, liveTasks, setTaskId]);

  useEffect(() => {
    void taskflowRealtimeManager.updatePresence({
      currentEntityId: taskId,
      currentView: taskId ? `task:${taskId}` : "/demos/taskflow/tasks",
    });
  }, [taskId]);

  const filteredTasks = useMemo(() => {
    return liveTasks.filter((task) => {
      const q = taskFilters.q.trim().toLowerCase();
      const project = findProject(projects, task.projectId);
      if (
        q &&
        !(
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          task.labels.some((label) => label.toLowerCase().includes(q)) ||
          (project?.name.toLowerCase().includes(q) ?? false)
        )
      ) {
        return false;
      }
      if (
        taskFilters.projectId !== "all" &&
        task.projectId !== taskFilters.projectId
      ) {
        return false;
      }
      if (
        taskFilters.assigneeId !== "all" &&
        task.assigneeId !== taskFilters.assigneeId
      ) {
        return false;
      }
      if (
        taskFilters.priority !== "all" &&
        task.priority !== taskFilters.priority
      ) {
        return false;
      }
      if (taskFilters.status !== "all" && task.status !== taskFilters.status) {
        return false;
      }
      if (
        taskFilters.label !== "all" &&
        !task.labels.includes(taskFilters.label)
      ) {
        return false;
      }
      if (taskFilters.overdueOnly && !(task.status !== "done" && task.dueDate < today)) {
        return false;
      }
      if (
        !matchesDueFilter(task.dueDate, task.status, taskFilters.due, today)
      ) {
        return false;
      }
      return true;
    });
  }, [liveTasks, taskFilters, projects, today]);

  function moveTask(id: string, status: TaskStatus) {
    const task = liveTasks.find((item) => item.id === id);
    void updateTask.mutateAsync({
      id,
      status,
      expectedVersion: task?.version ?? 1,
    });
    if (task) {
      setAnnounce(
        `Moved “${task.title}” to ${STATUS_LABELS[status]}.`,
      );
      if (status === "done") celebrate();
    }
  }

  function onDrop(status: TaskStatus) {
    if (!dragId) return;
    moveTask(dragId, status);
    setDragId(null);
    setDropTarget(null);
  }

  function closeDetail() {
    setTaskId(null);
    setConfirm(null);
    setEditOpen(false);
  }

  const hasActiveFilters =
    Boolean(taskFilters.q) ||
    taskFilters.projectId !== "all" ||
    taskFilters.assigneeId !== "all" ||
    taskFilters.priority !== "all" ||
    taskFilters.status !== "all" ||
    taskFilters.due !== "any" ||
    taskFilters.label !== "all" ||
    taskFilters.overdueOnly;

  if (isLoading) return <QueryLoadingState label="Loading tasks…" />;
  if (isError) {
    const message =
      error instanceof TaskflowApiError ? error.message : undefined;
    return <QueryErrorState message={message} onRetry={() => void refetch()} />;
  }
  if (!workspaceId) {
    return (
      <QueryErrorState message="No workspace available. Create or join a workspace to manage tasks." />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Drag cards between columns or use each card’s status control. Filters
        sync to the URL so you can share a focused board view.
      </p>

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announce}
      </div>

      {burst ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center"
          aria-hidden
        >
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="rounded-full border border-success/30 bg-success/15 px-4 py-2 text-sm font-medium text-success"
          >
            Task completed
          </motion.div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/60 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs text-muted">
            Search
            <input
              type="search"
              value={taskFilters.q}
              onChange={(event) =>
                setTaskFilters({ q: event.target.value || "" })
              }
              placeholder="Search title, labels, or project"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm text-ink"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
            >
              Filters
            </Button>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => clearTaskFilters()}
              >
                Clear
              </Button>
            ) : null}
            <div
              className="inline-flex rounded-lg border border-border p-0.5"
              role="group"
              aria-label="Board or list view"
            >
              {(["board", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "h-10 rounded-md px-3 text-xs font-medium capitalize",
                    viewMode === mode
                      ? "bg-accent/15 text-accent"
                      : "text-muted hover:text-ink",
                  )}
                  aria-pressed={viewMode === mode}
                >
                  {mode}
                </button>
              ))}
            </div>
            <Button type="button" onClick={() => setCreateOpen(true)}>
              Create task
            </Button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Project"
              value={taskFilters.projectId}
              onChange={(value) =>
                setTaskFilters({ projectId: value as string })
              }
              options={[
                { value: "all", label: "All projects" },
                ...projects
                  .filter((project) => !project.archived)
                  .map((project) => ({
                    value: project.id,
                    label: project.name,
                  })),
              ]}
            />
            <FilterSelect
              label="Assignee"
              value={taskFilters.assigneeId}
              onChange={(value) =>
                setTaskFilters({ assigneeId: value as string })
              }
              options={[
                { value: "all", label: "Anyone" },
                ...members.map((member) => ({
                  value: member.id,
                  label: member.name,
                })),
              ]}
            />
            <FilterSelect
              label="Priority"
              value={taskFilters.priority}
              onChange={(value) =>
                setTaskFilters({
                  priority: value as Priority | "all",
                })
              }
              options={[
                { value: "all", label: "All priorities" },
                { value: "urgent", label: "Urgent" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
            />
            <FilterSelect
              label="Status"
              value={taskFilters.status}
              onChange={(value) =>
                setTaskFilters({ status: value as TaskStatus | "all" })
              }
              options={[
                { value: "all", label: "All statuses" },
                ...TASK_COLUMNS.map((column) => ({
                  value: column.id,
                  label: column.label,
                })),
              ]}
            />
            <FilterSelect
              label="Due"
              value={taskFilters.due}
              onChange={(value) =>
                setTaskFilters({
                  due: value as typeof taskFilters.due,
                })
              }
              options={[
                { value: "any", label: "Any due date" },
                { value: "today", label: "Due today" },
                { value: "week", label: "Next 7 days" },
                { value: "overdue", label: "Overdue" },
              ]}
            />
            <FilterSelect
              label="Label"
              value={taskFilters.label}
              onChange={(value) => setTaskFilters({ label: value as string })}
              options={[
                { value: "all", label: "All labels" },
                ...labels.map((label) => ({ value: label, label })),
              ]}
            />
            <label className="flex items-center gap-2 text-xs text-muted sm:col-span-2">
              <input
                type="checkbox"
                checked={taskFilters.overdueOnly}
                onChange={(event) =>
                  setTaskFilters({ overdueOnly: event.target.checked })
                }
                className="size-4 rounded border-border"
              />
              Overdue only
            </label>
          </div>
        ) : null}
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No search results" : "No tasks yet"}
          description={
            hasActiveFilters
              ? "Nothing matches these filters. Clear them or create a task that fits."
              : "Create your first task to start filling the board."
          }
          actionLabel={hasActiveFilters ? "Clear filters" : "Create task"}
          onAction={
            hasActiveFilters
              ? () => clearTaskFilters()
              : () => setCreateOpen(true)
          }
        />
      ) : viewMode === "list" ? (
        <section className="overflow-hidden rounded-xl border border-border bg-surface/60">
          <ul className="divide-y divide-border" data-density-list>
            {filteredTasks.map((task) => {
              const project = findProject(projects, task.projectId);
              const assignee = findMember(members, task.assigneeId);
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => setTaskId(task.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-subtle/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {project?.name} · {STATUS_LABELS[task.status]} ·{" "}
                        {assignee?.name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                        priorityStyles[task.priority],
                      )}
                    >
                      {task.priority}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
          {TASK_COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter(
              (task) => task.status === column.id,
            );
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
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTarget(column.id);
                }}
                onDragLeave={(event) => {
                  if (
                    !event.currentTarget.contains(event.relatedTarget as Node)
                  ) {
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
                      projectName={
                        findProject(projects, task.projectId)?.name
                      }
                      assigneeAvatar={
                        findMember(members, task.assigneeId)?.avatar
                      }
                      assigneeName={
                        findMember(members, task.assigneeId)?.name
                      }
                      dragging={dragId === task.id}
                      onOpen={() => setTaskId(task.id)}
                      onDragStart={() => {
                        setDragId(task.id);
                        setAnnounce(`Dragging “${task.title}”.`);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropTarget(null);
                      }}
                      onStatusChange={(status) => moveTask(task.id, status)}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(selected) && !editOpen && !confirm}
        onClose={closeDetail}
        title={selected?.title ?? "Task"}
      >
        {selected && workspaceId ? (
          <TaskDetail
            task={selected}
            projectName={findProject(projects, selected.projectId)?.name}
            assigneeName={findMember(members, selected.assigneeId)?.name}
            workspaceId={workspaceId}
            currentUserId={currentUserId}
            canComment={canComment}
            onEdit={() => setEditOpen(true)}
            onArchive={() => setConfirm("archive")}
            onDelete={() => setConfirm("delete")}
            onClose={closeDetail}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(confirm && selected)}
        onClose={() => setConfirm(null)}
        title={confirm === "delete" ? "Delete task?" : "Archive task?"}
      >
        {selected && confirm ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted">
              {confirm === "delete"
                ? `Permanently remove “${selected.title}” from the workspace.`
                : `Archive “${selected.title}”.`}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                disabled={
                  confirm === "delete"
                    ? deleteTask.isPending
                    : updateTask.isPending
                }
                onClick={() => {
                  void (async () => {
                    if (confirm === "delete") {
                      await deleteTask.mutateAsync(selected.id);
                    } else {
                      await updateTask.mutateAsync({
                        id: selected.id,
                        archived: true,
                        expectedVersion: selected.version ?? 1,
                      });
                    }
                    setConfirm(null);
                    closeDetail();
                    setAnnounce(
                      confirm === "delete"
                        ? `Deleted “${selected.title}”.`
                        : `Archived “${selected.title}”.`,
                    );
                  })();
                }}
              >
                {confirm === "delete" ? "Delete" : "Archive"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <TaskEditorModal
        open={editorOpen}
        mode="create"
        workspaceId={workspaceId}
        projects={projects}
        members={members}
        onClose={() => {
          setCreateOpen(false);
          if (createFromUrl) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("create");
            const qs = params.toString();
            router.replace(qs ? `?${qs}` : "?", { scroll: false });
          }
        }}
        onSaved={(id) => {
          setTaskId(id);
          setAnnounce("Task created.");
        }}
      />

      <TaskEditorModal
        open={editOpen && Boolean(selected)}
        mode="edit"
        workspaceId={workspaceId}
        projects={projects}
        members={members}
        initial={selected}
        onClose={() => setEditOpen(false)}
        onSaved={() => setAnnounce("Task updated.")}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-2 text-sm text-ink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TaskCard({
  task,
  projectName,
  assigneeAvatar,
  assigneeName,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onStatusChange,
}: {
  task: Task;
  projectName?: string;
  assigneeAvatar?: string;
  assigneeName?: string;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  return (
    <motion.li
      layout={!dragging}
      whileHover={{ y: -2 }}
      transition={springHover}
      className={cn(
        "rounded-lg border border-border bg-elevated p-3 transition hover:border-accent/30",
        dragging && "opacity-60 ring-2 ring-accent/40",
      )}
      data-density-card
    >
      <article
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        aria-grabbed={dragging}
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
        <p className="mt-2 text-xs text-muted">{projectName}</p>
        <label className="mt-3 block text-xs text-muted">
          <span className="sr-only">Status for {task.title}</span>
          <select
            value={task.status}
            onChange={(event) =>
              onStatusChange(event.target.value as TaskStatus)
            }
            onPointerDown={(event) => event.stopPropagation()}
            className="h-10 w-full rounded-lg border border-border bg-surface px-2 text-xs capitalize text-ink"
            aria-label={`Change status for ${task.title}`}
          >
            {TASK_COLUMNS.map((column) => (
              <option key={column.id} value={column.id}>
                {column.label}
              </option>
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
              title={assigneeName}
            >
              {assigneeAvatar}
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

function TaskDetail({
  task,
  projectName,
  assigneeName,
  workspaceId,
  currentUserId,
  canComment,
  onEdit,
  onArchive,
  onDelete,
  onClose,
}: {
  task: Task;
  projectName?: string;
  assigneeName?: string;
  workspaceId: string;
  currentUserId: string | null;
  canComment: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">{task.description || "No description."}</p>
      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-elevated/50 p-3">
        <div>
          <dt className="text-xs text-muted">Status</dt>
          <dd className="mt-1">{STATUS_LABELS[task.status]}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Priority</dt>
          <dd className="mt-1 capitalize">{task.priority}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Project</dt>
          <dd className="mt-1">{projectName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Assignee</dt>
          <dd className="mt-1">{assigneeName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Due</dt>
          <dd className="mt-1">{formatDate(task.dueDate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Estimate</dt>
          <dd className="mt-1">
            {task.estimate != null ? `${task.estimate}h` : "—"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted">Labels</dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {task.labels.length
              ? task.labels.map((label) => (
                  <span
                    key={label}
                    className="rounded bg-subtle px-1.5 py-0.5 text-[11px] text-muted"
                  >
                    {label}
                  </span>
                ))
              : "—"}
          </dd>
        </div>
      </dl>

      <PlaceholderBlock
        title="Subtasks"
        description="Checklist breakdown is planned for a later iteration of this demo."
      />
      <TaskAttachments taskId={task.id} canEdit={canComment} />
      <EntityPresenceLine entityId={task.id} />
      <TaskComments
        taskId={task.id}
        workspaceId={workspaceId}
        currentUserId={currentUserId}
        canComment={canComment}
      />

      <TaskHistoryPanel taskId={task.id} />

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="outline" onClick={onArchive}>
          Archive
        </Button>
        <Button variant="outline" onClick={onDelete}>
          Delete
        </Button>
        <Button onClick={onEdit}>Edit</Button>
      </div>
    </div>
  );
}

function PlaceholderBlock({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-elevated/30 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  );
}
