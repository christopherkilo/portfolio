import type { Project, Task, TeamMember } from "@/lib/demos/taskflow/data";
import { todayDateOnly } from "@/lib/demos/taskflow/utils";
import {
  activeTasks,
  isOverdueTask,
  projectHealth,
} from "@/lib/demos/taskflow/store/selectors/projectSelectors";
import { busiestMember } from "@/lib/demos/taskflow/store/selectors/memberSelectors";

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

export function completedTodayCount(
  activity: { action: string; timestamp: string }[],
  day = todayDateOnly(),
) {
  return activity.filter(
    (item) => item.action === "completed" && item.timestamp.startsWith(day),
  ).length;
}

export function mostActiveProject(tasks: Task[], projects: Project[]) {
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

export function dashboardInsights(
  tasks: Task[],
  projects: Project[],
  members: TeamMember[],
  activity: { action: string; timestamp: string }[],
) {
  const stats = dashboardStats(tasks, projects);
  const completedToday = completedTodayCount(activity);
  const active = mostActiveProject(tasks, projects);
  const busy = busiestMember(tasks, members);
  const trend = completionTrend(tasks);

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
    completionTrend: trend,
  };
}

/** Rough completion trend: share of done tasks among the newest half vs oldest half by id order. */
export function completionTrend(tasks: Task[]) {
  const live = activeTasks(tasks);
  if (live.length < 4) return statsCompletion(live);
  const mid = Math.floor(live.length / 2);
  const recent = live.slice(0, mid);
  const older = live.slice(mid);
  return {
    recent: statsCompletion(recent),
    older: statsCompletion(older),
    delta: statsCompletion(recent) - statsCompletion(older),
  };
}

function statsCompletion(tasks: Task[]) {
  if (!tasks.length) return 0;
  return Math.round(
    (tasks.filter((task) => task.status === "done").length / tasks.length) *
      100,
  );
}

export function overdueTasks(tasks: Task[], today = todayDateOnly()) {
  return activeTasks(tasks).filter((task) => isOverdueTask(task, today));
}
