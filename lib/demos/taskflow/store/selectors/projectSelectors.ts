import type { Project, Task } from "@/lib/demos/taskflow/data";
import { todayDateOnly } from "@/lib/demos/taskflow/utils";

export function activeTasks(tasks: Task[]) {
  return tasks.filter((task) => !task.archived);
}

export function isBlockedTask(task: Task) {
  return (
    task.status === "review" ||
    task.labels.some((label) => label.toLowerCase() === "blocked")
  );
}

export function isOverdueTask(task: Task, today = todayDateOnly()) {
  return (
    Boolean(task.dueDate) &&
    task.status !== "done" &&
    task.dueDate < today
  );
}

export function projectTasks(tasks: Task[], projectId: string) {
  return activeTasks(tasks).filter((task) => task.projectId === projectId);
}

export function projectProgress(tasks: Task[], projectId: string) {
  const list = projectTasks(tasks, projectId);
  if (list.length === 0) return 0;
  const done = list.filter((task) => task.status === "done").length;
  return Math.round((done / list.length) * 100);
}

export function projectTaskCount(tasks: Task[], projectId: string) {
  return projectTasks(tasks, projectId).length;
}

export type ProjectHealth = {
  id: string;
  name: string;
  color: string;
  status: Project["status"];
  dueDate: string;
  archived?: boolean;
  completed: number;
  active: number;
  backlog: number;
  blocked: number;
  overdue: number;
  total: number;
  completion: number;
  nearestDueDate: string | null;
};

export function projectHealth(
  project: Project,
  tasks: Task[],
  today = todayDateOnly(),
): ProjectHealth {
  const list = projectTasks(tasks, project.id);
  const completed = list.filter((task) => task.status === "done").length;
  const active = list.filter((task) => task.status === "in-progress").length;
  const backlog = list.filter(
    (task) => task.status === "backlog" || task.status === "todo",
  ).length;
  const blocked = list.filter((task) => isBlockedTask(task) && task.status !== "done").length;
  const overdue = list.filter((task) => isOverdueTask(task, today)).length;
  const open = list.filter((task) => task.status !== "done");
  const nearestDueDate =
    open.length === 0
      ? null
      : [...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate ??
        null;

  return {
    id: project.id,
    name: project.name,
    color: project.color,
    status: project.status,
    dueDate: project.dueDate,
    archived: project.archived,
    completed,
    active,
    backlog,
    blocked,
    overdue,
    total: list.length,
    completion:
      list.length === 0 ? 0 : Math.round((completed / list.length) * 100),
    nearestDueDate,
  };
}

export function withDerivedProject(
  project: Project,
  tasks: Task[],
): Project & { progress: number; taskCount: number } {
  return {
    ...project,
    progress: projectProgress(tasks, project.id),
    taskCount: projectTaskCount(tasks, project.id),
  };
}

export function findProject(projects: Project[], id: string) {
  return projects.find((project) => project.id === id && !project.archived);
}
