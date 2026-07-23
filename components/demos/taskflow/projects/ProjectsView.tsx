"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { PROJECTS, TASKS, TEAM, type ProjectStatus } from "@/lib/demos/taskflow/data";
import { ProgressBar } from "@/components/demos/taskflow/ui/ProgressBar";
import { Dropdown } from "@/components/demos/taskflow/ui/Dropdown";
import { EmptyState } from "@/components/demos/taskflow/ui/EmptyState";
import { formatDate } from "@/lib/demos/taskflow/utils";
import { springHover, staggerContainer, staggerItem } from "@/lib/demos/taskflow/animation";
import { cn } from "@/lib/demos/taskflow/utils";
import { Modal } from "@/components/demos/taskflow/ui/Modal";
import { Button } from "@/components/demos/taskflow/ui/Button";

const statusStyles: Record<ProjectStatus, string> = {
  active: "bg-success/15 text-success",
  planning: "bg-accent/15 text-accent",
  paused: "bg-warning/15 text-warning",
  done: "bg-subtle-strong text-muted",
};

export function ProjectsView() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("progress");
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("project"),
  );
  const selected = PROJECTS.find((project) => project.id === selectedId) ?? null;
  const requestedProject = searchParams.get("project");

  useEffect(() => {
    if (requestedProject) {
      queueMicrotask(() => setSelectedId(requestedProject));
    }
  }, [requestedProject]);

  const filtered = useMemo(() => {
    let list = [...PROJECTS];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    if (status !== "all") {
      list = list.filter((p) => p.status === status);
    }
    switch (sort) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "due":
        list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        break;
      default:
        list.sort((a, b) => b.progress - a.progress);
    }
    return list;
  }, [query, status, sort]);

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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No projects match"
          description="Try a different search or clear filters."
        />
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((project) => (
            <motion.article
              key={project.id}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              transition={springHover}
              className="rounded-xl border border-border bg-surface p-4 shadow-[0_0_0_1px_transparent] transition hover:border-hover-border hover:shadow-[0_16px_40px_-28px_var(--shadow-color)]"
            >
              <button
                type="button"
                onClick={() => setSelectedId(project.id)}
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
                  <span>{project.taskCount} tasks</span>
                  <span>Due {formatDate(project.dueDate)}</span>
                </div>
                <ProgressBar value={project.progress} color={project.color} />
              </div>
              <div className="mt-4 flex -space-x-2">
                {project.members.map((id) => {
                  const member = TEAM.find((m) => m.id === id);
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
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? "Project"}
      >
        {selected ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted">{selected.description}</p>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-elevated/50 p-3">
              <div><dt className="text-xs text-muted">Status</dt><dd className="mt-1 capitalize">{selected.status}</dd></div>
              <div><dt className="text-xs text-muted">Progress</dt><dd className="mt-1">{selected.progress}%</dd></div>
              <div><dt className="text-xs text-muted">Due</dt><dd className="mt-1">{formatDate(selected.dueDate)}</dd></div>
              <div><dt className="text-xs text-muted">Open tasks</dt><dd className="mt-1">{TASKS.filter((task) => task.projectId === selected.id && task.status !== "done").length}</dd></div>
            </dl>
            <div>
              <p className="text-xs text-muted">Team</p>
              <p className="mt-1">{selected.members.map((id) => TEAM.find((member) => member.id === id)?.name).join(", ")}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
