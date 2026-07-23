"use client";

import { motion } from "framer-motion";
import {
  ACTIVITY,
  PROJECTS,
  TASKS,
  getMember,
  getProject,
} from "@/lib/demos/taskflow/data";
import { ProgressBar } from "@/components/demos/taskflow/ui/ProgressBar";
import { formatDate, formatDateLong, todayDateOnly } from "@/lib/demos/taskflow/utils";
import { staggerContainer, staggerItem } from "@/lib/demos/taskflow/animation";

export function DashboardView() {
  const activeProjects = PROJECTS.filter((p) => p.status === "active");
  const openTasks = TASKS.filter((t) => t.status !== "done");
  const urgent = openTasks.filter(
    (t) => t.priority === "urgent" || t.priority === "high",
  );
  const today = todayDateOnly();
  const upcoming = [...TASKS]
    .filter((task) => task.status !== "done" && task.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const stats = [
    { label: "Active projects", value: activeProjects.length },
    { label: "Open tasks", value: openTasks.length },
    { label: "High priority", value: urgent.length },
    {
      label: "Completion",
      value: `${Math.round(
        (TASKS.filter((t) => t.status === "done").length / TASKS.length) * 100,
      )}%`,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Project progress</h2>
          <ul className="mt-4 space-y-4">
            {PROJECTS.filter((p) => p.status !== "done").map((project) => (
              <li key={project.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-muted">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} color={project.color} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Upcoming deadlines</h2>
          <ul className="mt-4 space-y-3">
            {upcoming.map((task) => {
              const project = getProject(task.projectId);
              return (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-elevated/50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-muted">{project?.name}</p>
                  </div>
                  <time className="shrink-0 text-xs text-accent" dateTime={task.dueDate}>
                    {formatDate(task.dueDate)}
                  </time>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <ul className="mt-4 space-y-3">
          {ACTIVITY.map((item) => {
            const user = getMember(item.userId);
            return (
              <li key={item.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
                  {user?.avatar}
                </span>
                <div>
                  <p>
                    <span className="font-medium">{user?.name}</span>{" "}
                    <span className="text-muted">{item.action}</span>{" "}
                    <span className="font-medium">{item.target}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateLong(item.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
