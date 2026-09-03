import type {
  ActivityItem,
  Project,
  Task,
  TeamMember,
} from "../api/models";
import { todayDateOnly } from "./dates";

export function activeTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => !task.archived);
}

export function isBlockedTask(task: Task): boolean {
  return (
    task.status === "review" ||
    task.labels.some((label) => label.toLowerCase() === "blocked")
  );
}

export function isOverdueTask(task: Task, today = todayDateOnly()): boolean {
  return Boolean(task.dueDate) && task.status !== "done" && task.dueDate < today;
}

export function projectTasks(tasks: Task[], projectId: string): Task[] {
  return activeTasks(tasks).filter((task) => task.projectId === projectId);
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
  const blocked = list.filter(
    (task) => isBlockedTask(task) && task.status !== "done",
  ).length;
  const overdue = list.filter((task) => isOverdueTask(task, today)).length;
  const open = list.filter((task) => task.status !== "done");
  const nearestDueDate =
    open.length === 0
      ? null
      : [...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
          ?.dueDate ?? null;

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

export function findProject(projects: Project[], id: string): Project | undefined {
  return projects.find((project) => project.id === id && !project.archived);
}

export function findMember(
  members: TeamMember[],
  id: string,
): TeamMember | undefined {
  return members.find((member) => member.id === id);
}

export function overdueTasks(tasks: Task[], today = todayDateOnly()): Task[] {
  return activeTasks(tasks).filter((task) => isOverdueTask(task, today));
}

export function upcomingDeadlines(tasks: Task[], limit = 5): Task[] {
  const today = todayDateOnly();
  return [...activeTasks(tasks)]
    .filter((task) => task.status !== "done" && task.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
}

export function recentActivity(activity: ActivityItem[], limit = 12): ActivityItem[] {
  return [...activity]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

export function describeActivity(item: ActivityItem): string {
  if (item.summary) return item.summary;
  if (item.oldValue && item.newValue) {
    return `${item.action} ${item.entityTitle ?? item.target} from ${item.oldValue} to ${item.newValue}`;
  }
  if (item.newValue) {
    return `${item.action} ${item.entityTitle ?? item.target} → ${item.newValue}`;
  }
  return `${item.action} ${item.target}`;
}

export function completedTodayCount(
  activity: { action: string; timestamp: string }[],
  day = todayDateOnly(),
): number {
  return activity.filter(
    (item) => item.action === "completed" && item.timestamp.startsWith(day),
  ).length;
}

function statsCompletion(tasks: Task[]): number {
  if (!tasks.length) return 0;
  return Math.round(
    (tasks.filter((task) => task.status === "done").length / tasks.length) * 100,
  );
}

export function dashboardStats(tasks: Task[], projects: Project[]) {
  const liveTasks = activeTasks(tasks);
  const liveProjects = projects.filter((project) => !project.archived);
  const openTasks = liveTasks.filter((task) => task.status !== "done");
  const completed = liveTasks.filter((task) => task.status === "done");
  const today = todayDateOnly();
  const dueToday = liveTasks.filter(
    (task) => task.status !== "done" && task.dueDate === today,
  );
  const overdue = liveTasks.filter((task) => isOverdueTask(task, today));
  const highPriority = openTasks.filter(
    (task) => task.priority === "urgent" || task.priority === "high",
  );
  const activeProjects = liveProjects.filter(
    (project) => project.status === "active",
  );
  const completion =
    liveTasks.length === 0
      ? 0
      : Math.round((completed.length / liveTasks.length) * 100);

  return {
    activeProjects: activeProjects.length,
    openTasks: openTasks.length,
    completedTasks: completed.length,
    dueToday: dueToday.length,
    overdue: overdue.length,
    highPriority: highPriority.length,
    completion,
  };
}

function mostActiveProject(tasks: Task[], projects: Project[]) {
  const live = projects.filter((project) => !project.archived);
  if (!live.length) return null;
  return (
    [...live]
      .map((project) => ({
        project,
        health: projectHealth(project, tasks),
      }))
      .sort(
        (a, b) =>
          b.health.active +
          b.health.backlog -
          (a.health.active + a.health.backlog),
      )[0] ?? null
  );
}

export type WorkloadLabel = "Light" | "Normal" | "Busy" | "Overloaded";

export function workloadLabel(activeCount: number): WorkloadLabel {
  if (activeCount <= 2) return "Light";
  if (activeCount <= 5) return "Normal";
  if (activeCount <= 8) return "Busy";
  return "Overloaded";
}

function memberActiveCount(tasks: Task[], memberId: string): number {
  return activeTasks(tasks).filter(
    (task) => task.assigneeId === memberId && task.status !== "done",
  ).length;
}

function busiestMember(tasks: Task[], members: TeamMember[]) {
  const ranked = members
    .map((member) => {
      const active = memberActiveCount(tasks, member.id);
      const overdue = activeTasks(tasks).filter(
        (task) => task.assigneeId === member.id && isOverdueTask(task),
      ).length;
      return { member, active, overdue, label: workloadLabel(active) };
    })
    .sort((a, b) => b.active - a.active || b.overdue - a.overdue);
  return ranked[0] ?? null;
}

export function dashboardInsights(
  tasks: Task[],
  projects: Project[],
  members: TeamMember[],
  activity: ActivityItem[],
) {
  const stats = dashboardStats(tasks, projects);
  const completedToday = completedTodayCount(activity);
  const active = mostActiveProject(tasks, projects);
  const busy = busiestMember(tasks, members);

  return {
    ...stats,
    completedToday,
    mostActiveProject: active
      ? {
          id: active.project.id,
          name: active.project.name,
          open:
            active.health.active +
            active.health.backlog +
            active.health.blocked,
        }
      : null,
    busiestMember: busy
      ? {
          id: busy.member.id,
          name: busy.member.name,
          active: busy.active,
          label: busy.label,
        }
      : null,
  };
}

export type MemberWorkload = {
  member: TeamMember;
  assigned: number;
  completed: number;
  active: number;
  overdue: number;
  completion: number;
  label: WorkloadLabel;
};

export function memberWorkloadStats(
  tasks: Task[],
  member: TeamMember,
  today = todayDateOnly(),
): MemberWorkload {
  const assignedTasks = activeTasks(tasks).filter(
    (task) => task.assigneeId === member.id,
  );
  const completed = assignedTasks.filter((task) => task.status === "done").length;
  const active = assignedTasks.filter((task) => task.status !== "done").length;
  const overdue = assignedTasks.filter((task) => isOverdueTask(task, today)).length;
  const assigned = assignedTasks.length;
  const completion =
    assigned === 0 ? 0 : Math.round((completed / assigned) * 100);
  return {
    member,
    assigned,
    completed,
    active,
    overdue,
    completion,
    label: workloadLabel(active),
  };
}
