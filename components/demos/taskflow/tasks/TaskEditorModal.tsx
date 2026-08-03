"use client";

import { useState } from "react";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { Modal } from "@/components/demos/taskflow/ui/Modal";
import {
  TASK_COLUMNS,
  type Priority,
  type Project,
  type Task,
  type TaskStatus,
  type TeamMember,
} from "@/lib/demos/taskflow/data";
import {
  taskDraftSchema,
  type TaskDraftInput,
} from "@/lib/demos/taskflow/store/schemas";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "@/lib/demos/taskflow/api/hooks";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import {
  useAssignTask,
  useUnassignTask,
} from "@/lib/demos/taskflow/queries";
import { cn, todayDateOnly } from "@/lib/demos/taskflow/utils";

const priorities: Priority[] = ["low", "medium", "high", "urgent"];

type TaskEditorModalProps = {
  open: boolean;
  mode: "create" | "edit";
  workspaceId: string | null;
  projects: Project[];
  members: TeamMember[];
  initial?: Task | null;
  onClose: () => void;
  onSaved?: (taskId: string) => void;
};

function toDraft(
  task: Task | null | undefined,
  projects: Project[],
  members: TeamMember[],
): TaskDraftInput {
  const liveProjects = projects.filter((project) => !project.archived);
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "backlog",
    priority: task?.priority ?? "medium",
    projectId: task?.projectId ?? liveProjects[0]?.id ?? "",
    assigneeId: task?.assigneeId || members[0]?.id || "",
    dueDate: task?.dueDate || todayDateOnly(),
    labels: task?.labels ?? [],
    estimate: task?.estimate,
  };
}

function initialAssigneeIds(task: Task | null | undefined, members: TeamMember[]) {
  if (task?.assigneeId) return [task.assigneeId];
  if (members[0]?.id) return [members[0].id];
  return [] as string[];
}

export function TaskEditorModal({
  open,
  mode,
  workspaceId,
  projects,
  members,
  initial,
  onClose,
  onSaved,
}: TaskEditorModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Create task" : "Edit task"}
    >
      {open ? (
        <TaskEditorForm
          key={`${mode}-${initial?.id ?? "new"}`}
          mode={mode}
          workspaceId={workspaceId}
          projects={projects}
          members={members}
          initial={initial}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function TaskEditorForm({
  mode,
  workspaceId,
  projects,
  members,
  initial,
  onClose,
  onSaved,
}: Omit<TaskEditorModalProps, "open">) {
  const liveProjects = projects.filter((project) => !project.archived);
  const createTask = useCreateTaskMutation(workspaceId);
  const updateTask = useUpdateTaskMutation(workspaceId);
  const assignTask = useAssignTask(workspaceId);
  const unassignTask = useUnassignTask(workspaceId);
  const [draft, setDraft] = useState(() =>
    toDraft(initial, projects, members),
  );
  const [assigneeIds, setAssigneeIds] = useState<string[]>(() =>
    initialAssigneeIds(initial, members),
  );
  const [labelInput, setLabelInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const busy =
    createTask.isPending ||
    updateTask.isPending ||
    assignTask.isPending ||
    unassignTask.isPending;

  function toggleAssignee(memberId: string) {
    setAssigneeIds((current) => {
      const next = current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId];
      setDraft((draftCurrent) => ({
        ...draftCurrent,
        assigneeId: next[0] ?? "",
      }));
      return next;
    });
  }

  async function syncAssignees(taskId: string, previousIds: string[]) {
    const next = new Set(assigneeIds);
    const prev = new Set(previousIds);
    const toAdd = assigneeIds.filter((id) => !prev.has(id));
    const toRemove = previousIds.filter((id) => !next.has(id));
    await Promise.all([
      ...toAdd.map((userId) => assignTask.mutateAsync({ taskId, userId })),
      ...toRemove.map((userId) => unassignTask.mutateAsync({ taskId, userId })),
    ]);
  }

  async function submit() {
    setSubmitError("");
    const parsed = taskDraftSchema.safeParse({
      ...draft,
      assigneeId: assigneeIds[0] ?? "",
      labels: draft.labels,
      estimate:
        draft.estimate === undefined || Number.isNaN(draft.estimate)
          ? undefined
          : draft.estimate,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "title");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    if (!workspaceId) {
      setSubmitError("No workspace available.");
      return;
    }

    const payload = {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      projectId: parsed.data.projectId,
      assigneeId: parsed.data.assigneeId || null,
      dueDate: parsed.data.dueDate || null,
      labels: parsed.data.labels,
      estimate: parsed.data.estimate ?? null,
    };

    try {
      if (mode === "create") {
        const created = await createTask.mutateAsync({
          workspaceId,
          ...payload,
        });
        const extras = assigneeIds.slice(1);
        if (extras.length) {
          await Promise.all(
            extras.map((userId) =>
              assignTask.mutateAsync({ taskId: created.id, userId }),
            ),
          );
        }
        onSaved?.(created.id);
      } else if (initial) {
        await updateTask.mutateAsync({
          id: initial.id,
          expectedVersion: initial.version ?? 1,
          ...payload,
        });
        const previous = initial.assigneeId ? [initial.assigneeId] : [];
        await syncAssignees(initial.id, previous);
        onSaved?.(initial.id);
      }
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof TaskflowApiError
          ? error.message
          : "Couldn’t save task. Try again.",
      );
    }
  }

  function addLabel() {
    const value = labelInput.trim().toLowerCase();
    if (!value || draft.labels.includes(value) || draft.labels.length >= 8) {
      setLabelInput("");
      return;
    }
    setDraft((current) => ({ ...current, labels: [...current.labels, value] }));
    setLabelInput("");
  }

  return (
    <div className="space-y-4 text-sm">
      <label className="block text-xs text-muted">
        Title
        <input
          value={draft.title}
          onChange={(event) =>
            setDraft((current) => ({ ...current, title: event.target.value }))
          }
          className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm text-ink"
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title ? (
          <span className="mt-1 block text-xs text-danger">{errors.title}</span>
        ) : null}
      </label>

      <label className="block text-xs text-muted">
        Description
        <textarea
          value={draft.description}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          rows={3}
          className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted">
          Project
          <select
            value={draft.projectId}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                projectId: event.target.value,
              }))
            }
            className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-2 text-sm text-ink"
          >
            {liveProjects.length === 0 ? (
              <option value="">No projects</option>
            ) : (
              liveProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))
            )}
          </select>
          {errors.projectId ? (
            <span className="mt-1 block text-xs text-danger">
              {errors.projectId}
            </span>
          ) : null}
        </label>
        <div className="block text-xs text-muted sm:col-span-1">
          <p>Assignees</p>
          <div className="mt-1 flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border bg-elevated p-2">
            {members.length === 0 ? (
              <span className="text-xs text-muted">No members</span>
            ) : (
              members.map((member) => {
                const selected = assigneeIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleAssignee(member.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition",
                      selected
                        ? "border-accent/40 bg-accent/15 text-accent"
                        : "border-border bg-surface text-muted hover:text-ink",
                    )}
                    aria-pressed={selected}
                  >
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
                      {member.avatar}
                    </span>
                    {member.name}
                  </button>
                );
              })
            )}
          </div>
          {errors.assigneeId ? (
            <span className="mt-1 block text-xs text-danger">
              {errors.assigneeId}
            </span>
          ) : null}
        </div>
        <label className="block text-xs text-muted">
          Priority
          <select
            value={draft.priority}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                priority: event.target.value as Priority,
              }))
            }
            className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-2 text-sm capitalize text-ink"
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Status
          <select
            value={draft.status}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                status: event.target.value as TaskStatus,
              }))
            }
            className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-2 text-sm text-ink"
          >
            {TASK_COLUMNS.map((column) => (
              <option key={column.id} value={column.id}>
                {column.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Due date
          <input
            type="date"
            value={draft.dueDate}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                dueDate: event.target.value,
              }))
            }
            className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm text-ink"
          />
        </label>
        <label className="block text-xs text-muted">
          Estimate (hours, optional)
          <input
            type="number"
            min={0}
            max={400}
            value={draft.estimate ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                estimate:
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value),
              }))
            }
            className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm text-ink"
          />
        </label>
      </div>

      <div>
        <p className="text-xs text-muted">Labels</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {draft.labels.map((label) => (
            <button
              key={label}
              type="button"
              className="rounded bg-subtle px-2 py-1 text-[11px] text-muted hover:bg-danger/15 hover:text-danger"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  labels: current.labels.filter((item) => item !== label),
                }))
              }
            >
              {label} ×
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={labelInput}
            onChange={(event) => setLabelInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addLabel();
              }
            }}
            placeholder="Add label"
            className="h-10 flex-1 rounded-lg border border-border bg-elevated px-3 text-sm text-ink"
          />
          <Button type="button" variant="outline" onClick={addLabel}>
            Add
          </Button>
        </div>
      </div>

      {submitError ? (
        <p role="alert" className="text-xs text-danger">
          {submitError}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="button" onClick={() => void submit()} disabled={busy}>
          {busy
            ? "Saving…"
            : mode === "create"
              ? "Create task"
              : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
