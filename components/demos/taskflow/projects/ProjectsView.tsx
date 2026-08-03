"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import type {
  Project,
  ProjectStatus,
  Task,
  TeamMember,
} from "@/lib/demos/taskflow/data";
import { ProgressBar } from "@/components/demos/taskflow/ui/ProgressBar";
import { Dropdown } from "@/components/demos/taskflow/ui/Dropdown";
import { EmptyState } from "@/components/demos/taskflow/ui/EmptyState";
import {
  QueryErrorState,
  QueryLoadingState,
} from "@/components/demos/taskflow/shared/QueryStates";
import { formatDate, todayDateOnly, cn } from "@/lib/demos/taskflow/utils";
import {
  springHover,
  staggerContainer,
  staggerItem,
} from "@/lib/demos/taskflow/animation";
import { Modal } from "@/components/demos/taskflow/ui/Modal";
import { Button } from "@/components/demos/taskflow/ui/Button";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useWorkspaceData,
} from "@/lib/demos/taskflow/api/hooks";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import {
  findMember,
  projectHealth,
  projectTasks,
} from "@/lib/demos/taskflow/store/selectors";
import { useTaskflowUrlState } from "@/lib/demos/taskflow/url";

const statusStyles: Record<ProjectStatus, string> = {
  active: "bg-success/15 text-success",
  planning: "bg-accent/15 text-accent",
  paused: "bg-warning/15 text-warning",
  done: "bg-subtle-strong text-muted",
};

const colors = ["#60A5FA", "#34D399", "#FBBF24", "#F472B6", "#A78BFA"];

export function ProjectsView() {
  const {
    projects,
    tasks,
    members,
    workspaceId,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkspaceData();
  const createProject = useCreateProjectMutation(workspaceId);
  const updateProject = useUpdateProjectMutation(workspaceId);

  const { projectId, filter, setProjectId, setFilter } = useTaskflowUrlState();
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("progress");
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    dueDate: todayDateOnly(),
    color: colors[0],
  });

  const healthRows = useMemo(
    () =>
      projects
        .filter((project) => !project.archived)
        .map((project) => ({
          project,
          health: projectHealth(project, tasks),
        })),
    [projects, tasks],
  );

  const selected =
    projects.find((project) => project.id === projectId) ?? null;

  useEffect(() => {
    if (projectId && !projects.some((project) => project.id === projectId)) {
      setProjectId(null);
    }
  }, [projectId, projects, setProjectId]);

  const filtered = useMemo(() => {
    let list = [...healthRows];
    const q = filter.trim().toLowerCase();
    if (q) {
      list = list.filter(
        ({ project }) =>
          project.name.toLowerCase().includes(q) ||
          project.description.toLowerCase().includes(q),
      );
    }
    if (status !== "all") {
      list = list.filter(({ project }) => project.status === status);
    }
    switch (sort) {
      case "name":
        list.sort((a, b) => a.project.name.localeCompare(b.project.name));
        break;
      case "due":
        list.sort((a, b) => a.project.dueDate.localeCompare(b.project.dueDate));
        break;
      default:
        list.sort((a, b) => b.health.completion - a.health.completion);
    }
    return list;
  }, [healthRows, filter, status, sort]);

  if (isLoading) return <QueryLoadingState label="Loading projects…" />;
  if (isError) {
    const message =
      error instanceof TaskflowApiError ? error.message : undefined;
    return <QueryErrorState message={message} onRetry={() => void refetch()} />;
  }
  if (!workspaceId) {
    return (
      <QueryErrorState message="No workspace available. Create or join a workspace to manage projects." />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            id="project-search"
            value={filter}
            onChange={(event) => setFilter(event.target.value || null)}
            placeholder="Search projects…"
            className="h-9 w-full rounded-lg border border-border bg-elevated pl-9 pr-3 text-sm outline-none focus:border-accent/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Dropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "planning", label: "Planning" },
              { value: "paused", label: "Paused" },
              { value: "done", label: "Done" },
            ]}
          />
          <Dropdown
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: "progress", label: "Progress" },
              { value: "due", label: "Due date" },
              { value: "name", label: "Name" },
            ]}
          />
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New project
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No projects match"
          description="Try a different search, clear filters, or create a new project."
          actionLabel="Clear search"
          onAction={() => setFilter(null)}
        />
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filtered.map(({ project, health }) => (
            <motion.article
              key={project.id}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              transition={springHover}
              className="rounded-xl border border-border bg-surface p-4 shadow-[0_0_0_1px_transparent] transition hover:border-hover-border hover:shadow-[0_16px_40px_-28px_var(--shadow-color)]"
            >
              <button
                type="button"
                onClick={() => setProjectId(project.id)}
                className="w-full text-left"
                aria-label={`Open ${project.name} details`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: project.color }}
                      aria-hidden
                    />
                    <h2 className="text-sm font-semibold">{project.name}</h2>
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-medium capitalize",
                      statusStyles[project.status],
                    )}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">{project.description}</p>
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-xs text-muted">
                    <span>{health.completion}% complete</span>
                    <span>Due {formatDate(project.dueDate)}</span>
                  </div>
                  <ProgressBar value={health.completion} color={project.color} />
                  <p className="mt-2 text-xs text-muted">
                    {health.completed} complete · {health.active} active ·{" "}
                    {health.overdue} overdue · {health.blocked} blocked
                  </p>
                  {health.nearestDueDate ? (
                    <p className="mt-1 text-xs text-muted">
                      Next due {formatDate(health.nearestDueDate)}
                    </p>
                  ) : null}
                </div>
                <div className="mt-4 flex -space-x-2">
                  {project.members.map((id) => {
                    const member = findMember(members, id);
                    return (
                      <span
                        key={id}
                        title={member?.name}
                        className="inline-flex size-7 items-center justify-center rounded-full border border-bg bg-elevated text-[10px] font-semibold"
                      >
                        {member?.avatar}
                      </span>
                    );
                  })}
                </div>
                <span className="mt-4 inline-block text-xs font-medium text-accent">
                  View project details
                </span>
              </button>
            </motion.article>
          ))}
        </motion.div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setProjectId(null)}
        title={selected?.name ?? "Project"}
      >
        {selected ? (
          <ProjectDetail
            key={selected.id}
            project={selected}
            tasks={tasks}
            members={members}
            busy={updateProject.isPending}
            onClose={() => setProjectId(null)}
            onRename={(name) => {
              void updateProject.mutateAsync({
                id: selected.id,
                name,
                expectedVersion: selected.version ?? 1,
              });
            }}
            onArchive={() => {
              void updateProject
                .mutateAsync({
                  id: selected.id,
                  archived: true,
                  expectedVersion: selected.version ?? 1,
                })
                .then(() => setProjectId(null));
            }}
            onRestore={() => {
              void updateProject.mutateAsync({
                id: selected.id,
                archived: false,
                expectedVersion: selected.version ?? 1,
              });
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateError("");
        }}
        title="Create project"
      >
        <div className="space-y-4 text-sm">
          <label className="block text-xs text-muted">
            Name
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm text-ink"
            />
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
          {createError ? (
            <p role="alert" className="text-xs text-danger">
              {createError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setCreateError("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={createProject.isPending || !draft.name.trim()}
              onClick={() => {
                void (async () => {
                  setCreateError("");
                  try {
                    const created = await createProject.mutateAsync({
                      workspaceId,
                      name: draft.name.trim(),
                      description: draft.description,
                      dueDate: draft.dueDate || null,
                      color: draft.color,
                      status: "planning",
                    });
                    setCreateOpen(false);
                    setDraft({
                      name: "",
                      description: "",
                      dueDate: todayDateOnly(),
                      color: colors[0],
                    });
                    setProjectId(created.id);
                  } catch (err) {
                    setCreateError(
                      err instanceof TaskflowApiError
                        ? err.message
                        : "Couldn’t create project.",
                    );
                  }
                })();
              }}
            >
              {createProject.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ProjectDetail({
  project,
  tasks,
  members,
  busy,
  onClose,
  onRename,
  onArchive,
  onRestore,
}: {
  project: Project;
  tasks: Task[];
  members: TeamMember[];
  busy: boolean;
  onClose: () => void;
  onRename: (name: string) => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const [renameValue, setRenameValue] = useState(project.name);
  const health = projectHealth(project, tasks);

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">{project.description}</p>
      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-elevated/50 p-3">
        <div>
          <dt className="text-xs text-muted">Completion</dt>
          <dd className="mt-1">{health.completion}%</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Complete</dt>
          <dd className="mt-1">{health.completed}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Active</dt>
          <dd className="mt-1">{health.active}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Backlog</dt>
          <dd className="mt-1">{health.backlog}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Blocked</dt>
          <dd className="mt-1">{health.blocked}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Overdue</dt>
          <dd className="mt-1">{health.overdue}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Nearest due</dt>
          <dd className="mt-1">
            {health.nearestDueDate
              ? formatDate(health.nearestDueDate)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Open tasks</dt>
          <dd className="mt-1">
            {
              projectTasks(tasks, project.id).filter(
                (task) => task.status !== "done",
              ).length
            }
          </dd>
        </div>
      </dl>
      <ProgressBar value={health.completion} color={project.color} />
      <label className="block text-xs text-muted">
        Rename
        <input
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm text-ink"
        />
      </label>
      <div>
        <p className="text-xs text-muted">Team</p>
        <p className="mt-1">
          {project.members
            .map((id) => findMember(members, id)?.name)
            .filter(Boolean)
            .join(", ") || "—"}
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {project.archived ? (
          <Button disabled={busy} onClick={onRestore}>
            Restore
          </Button>
        ) : (
          <Button variant="outline" disabled={busy} onClick={onArchive}>
            Archive
          </Button>
        )}
        <Button
          disabled={busy || !renameValue.trim()}
          onClick={() => onRename(renameValue.trim())}
        >
          Save name
        </Button>
      </div>
    </div>
  );
}
