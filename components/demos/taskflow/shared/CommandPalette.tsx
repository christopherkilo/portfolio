"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { DEMO_BASE, NAV_ITEMS } from "@/lib/demos/taskflow/data";
import { cn, todayDateOnly } from "@/lib/demos/taskflow/utils";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useUpdateTaskMutation,
  useWorkspaceData,
} from "@/lib/demos/taskflow/api/hooks";
import {
  activeTasks,
  recentActivity,
} from "@/lib/demos/taskflow/store/selectors";
import { describeActivity } from "@/lib/demos/taskflow/store/selectors";

type Item = {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  run?: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  onCreateTask,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { projects, tasks, members, activity, workspaceId } = useWorkspaceData();
  const createProject = useCreateProjectMutation(workspaceId);
  const updateProject = useUpdateProjectMutation(workspaceId);
  const updateTask = useUpdateTaskMutation(workspaceId);

  const items = useMemo<Item[]>(() => {
    const actions: Item[] = [
      {
        id: "action-create-task",
        label: "Create task",
        hint: "Action",
        run: () => onCreateTask?.(),
      },
      {
        id: "action-create-project",
        label: "Create project",
        hint: "Action",
        run: () => {
          if (!workspaceId) return;
          void createProject
            .mutateAsync({
              workspaceId,
              name: "New project",
              description: "Created from command palette",
              dueDate: todayDateOnly(),
              color: "#60A5FA",
              status: "planning",
            })
            .then((created) => {
              router.push(
                `${DEMO_BASE}/projects?project=${encodeURIComponent(created.id)}`,
              );
            });
        },
      },
      {
        id: "action-calendar",
        label: "Open calendar",
        hint: "Action",
        href: `${DEMO_BASE}/calendar`,
      },
    ];

    const openTask = activeTasks(tasks).find((task) => task.status !== "done");
    if (openTask) {
      actions.push({
        id: `action-complete-${openTask.id}`,
        label: `Mark complete: ${openTask.title}`,
        hint: "Action",
        run: () => {
          void updateTask.mutateAsync({
            id: openTask.id,
            status: "done",
            expectedVersion: openTask.version ?? 1,
          });
        },
      });
    }

    const liveProject = projects.find((project) => !project.archived);
    if (liveProject) {
      actions.push({
        id: `action-archive-${liveProject.id}`,
        label: `Archive project: ${liveProject.name}`,
        hint: "Action",
        run: () => {
          void updateProject.mutateAsync({
            id: liveProject.id,
            archived: true,
            expectedVersion: liveProject.version ?? 1,
          });
        },
      });
    }

    const nav = NAV_ITEMS.map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      hint: "Navigate",
      href: item.href,
    }));
    const liveProjects = projects
      .filter((project) => !project.archived)
      .map((project) => ({
        id: `proj-${project.id}`,
        label: project.name,
        hint: "Project",
        href: `${DEMO_BASE}/projects?project=${project.id}`,
      }));
    const liveTasks = activeTasks(tasks).map((task) => ({
      id: `task-${task.id}`,
      label: task.title,
      hint: "Task",
      href: `${DEMO_BASE}/tasks?task=${task.id}`,
    }));
    const people = members.map((member) => ({
      id: `member-${member.id}`,
      label: member.name,
      hint: "Member",
      href: `${DEMO_BASE}/team`,
    }));
    const recent = recentActivity(activity, 6).map((item) => ({
      id: `activity-${item.id}`,
      label: describeActivity(item),
      hint: "Recent",
      href: `${DEMO_BASE}/dashboard`,
    }));
    return [
      ...actions,
      ...nav,
      ...liveProjects,
      ...liveTasks,
      ...people,
      ...recent,
    ];
  }, [
    projects,
    tasks,
    members,
    activity,
    onCreateTask,
    workspaceId,
    createProject,
    updateTask,
    updateProject,
    router,
  ]);

  const filtered = items.filter((item) =>
    `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase()),
  );

  const closePalette = useCallback(() => {
    setQuery("");
    setActive(0);
    onOpenChange(false);
  }, [onOpenChange]);

  const runItem = useCallback(
    (item: Item) => {
      if (item.run) item.run();
      else if (item.href) router.push(item.href);
      closePalette();
    },
    [closePalette, router],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) closePalette();
        else {
          setQuery("");
          setActive(0);
          onOpenChange(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePalette, open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePalette();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((index) =>
          Math.min(index + 1, Math.max(filtered.length - 1, 0)),
        );
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
      }
      if (event.key === "Enter" && filtered[active]) {
        event.preventDefault();
        runItem(filtered[active]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, closePalette, runItem]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`command-option-${active}`)?.scrollIntoView({
      block: "nearest",
    });
  }, [active, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-overlay px-4 pt-[15vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePalette}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="size-4 text-muted" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                placeholder="Search or run an action…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                aria-label="Command search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls="command-results"
                aria-activedescendant={
                  filtered[active] ? `command-option-${active}` : undefined
                }
              />
            </div>
            <ul
              id="command-results"
              className="max-h-72 overflow-y-auto p-2"
              role="listbox"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  No results. Try a project name, task, or “create task”.
                </li>
              ) : (
                filtered.map((item, index) => (
                  <li key={item.id}>
                    <button
                      id={`command-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                        index === active
                          ? "bg-accent/15 text-ink"
                          : "text-muted hover:bg-subtle",
                      )}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => runItem(item)}
                    >
                      <span className="font-medium text-ink">{item.label}</span>
                      <span className="text-xs text-muted">{item.hint}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
