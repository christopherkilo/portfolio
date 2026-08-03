"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ProgressBar } from "@/components/demos/taskflow/ui/ProgressBar";
import { EmptyState } from "@/components/demos/taskflow/ui/EmptyState";
import { ActivityFeed } from "@/components/demos/taskflow/shared/ActivityFeed";
import {
  QueryErrorState,
  QueryLoadingState,
} from "@/components/demos/taskflow/shared/QueryStates";
import { DEMO_BASE } from "@/lib/demos/taskflow/data";
import { formatDate } from "@/lib/demos/taskflow/utils";
import { staggerContainer, staggerItem } from "@/lib/demos/taskflow/animation";
import { useWorkspaceData } from "@/lib/demos/taskflow/api/hooks";
import {
  dashboardInsights,
  findProject,
  overdueTasks,
  projectHealth,
  recentActivity,
  upcomingDeadlines,
} from "@/lib/demos/taskflow/store/selectors";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";

function AnimatedValue({ value }: { value: string | number }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <span className="font-display text-2xl font-semibold">{value}</span>;
  }
  return (
    <motion.span
      key={String(value)}
      className="inline-block font-display text-2xl font-semibold"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {value}
    </motion.span>
  );
}

export function DashboardView() {
  const {
    tasks,
    projects,
    members,
    activity,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkspaceData();

  const insights = useMemo(
    () => dashboardInsights(tasks, projects, members, activity),
    [tasks, projects, members, activity],
  );
  const upcoming = useMemo(() => upcomingDeadlines(tasks, 5), [tasks]);
  const overdue = useMemo(() => overdueTasks(tasks), [tasks]);
  const feed = useMemo(() => recentActivity(activity, 8), [activity]);
  const projectRows = useMemo(
    () =>
      projects
        .filter((project) => !project.archived && project.status !== "done")
        .map((project) => projectHealth(project, tasks)),
    [projects, tasks],
  );

  if (isLoading) return <QueryLoadingState label="Loading dashboard…" />;
  if (isError) {
    const message =
      error instanceof TaskflowApiError ? error.message : undefined;
    return <QueryErrorState message={message} onRetry={() => void refetch()} />;
  }

  const cards = [
    { label: "Completed today", value: insights.completedToday },
    { label: "Overdue", value: insights.overdue },
    { label: "Due today", value: insights.dueToday },
    { label: "Completion", value: `${insights.completion}%` },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {cards.map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="mt-2">
              <AnimatedValue value={stat.value} />
            </p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Workspace pulse</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Most active project</dt>
              <dd className="text-right font-medium">
                {insights.mostActiveProject
                  ? `${insights.mostActiveProject.name} (${insights.mostActiveProject.open} open)`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Busiest teammate</dt>
              <dd className="text-right font-medium">
                {insights.busiestMember
                  ? `${insights.busiestMember.name} · ${insights.busiestMember.label}`
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Overdue tasks</h2>
          {overdue.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No overdue tasks"
                description="Everything due so far is on track."
                actionLabel="Open tasks"
                actionHref={`${DEMO_BASE}/tasks`}
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {overdue.slice(0, 5).map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{task.title}</span>
                  <time className="text-xs text-danger" dateTime={task.dueDate}>
                    {formatDate(task.dueDate)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Project health</h2>
          {projectRows.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No active projects"
                description="Create a project to start tracking completion and overdue work."
                actionLabel="View projects"
                actionHref={`${DEMO_BASE}/projects`}
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {projectRows.map((project) => (
                <li key={project.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-muted">{project.completion}%</span>
                  </div>
                  <ProgressBar value={project.completion} color={project.color} />
                  <p className="mt-2 text-xs text-muted">
                    {project.completed} complete · {project.active} active ·{" "}
                    {project.overdue} overdue · {project.blocked} blocked
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Upcoming deadlines</h2>
          {upcoming.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No upcoming deadlines"
                description="Add due dates on open tasks to fill this list."
                actionLabel="Open calendar"
                actionHref={`${DEMO_BASE}/calendar`}
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((task) => {
                const project = findProject(projects, task.projectId);
                return (
                  <li
                    key={task.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-elevated/50 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-muted">{project?.name}</p>
                    </div>
                    <time
                      className="shrink-0 text-xs text-accent"
                      dateTime={task.dueDate}
                    >
                      {formatDate(task.dueDate)}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <div className="mt-4">
          <ActivityFeed items={feed} members={members} />
        </div>
      </section>
    </div>
  );
}
