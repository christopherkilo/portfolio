import type { Task, TeamMember } from "@/lib/demos/taskflow/data";
import { todayDateOnly } from "@/lib/demos/taskflow/utils";
import { activeTasks, isOverdueTask } from "@/lib/demos/taskflow/store/selectors/projectSelectors";

export type WorkloadLabel = "Light" | "Normal" | "Busy" | "Overloaded";

export type MemberWorkload = {
  member: TeamMember;
  assigned: number;
  completed: number;
  active: number;
  overdue: number;
  completion: number;
  label: WorkloadLabel;
};

export function workloadLabel(activeCount: number): WorkloadLabel {
  if (activeCount <= 2) return "Light";
  if (activeCount <= 5) return "Normal";
  if (activeCount <= 8) return "Busy";
  return "Overloaded";
}

export function memberWorkload(tasks: Task[], memberId: string) {
  return activeTasks(tasks).filter(
    (task) => task.assigneeId === memberId && task.status !== "done",
  ).length;
}

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

export function busiestMember(tasks: Task[], members: TeamMember[]) {
  const ranked = members
    .map((member) => memberWorkloadStats(tasks, member))
    .sort((a, b) => b.active - a.active || b.overdue - a.overdue);
  return ranked[0] ?? null;
}

export function findMember(members: TeamMember[], id: string) {
  return members.find((member) => member.id === id);
}
