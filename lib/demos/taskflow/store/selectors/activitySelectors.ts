import type { ActivityItem, Task } from "@/lib/demos/taskflow/data";
import { todayDateOnly } from "@/lib/demos/taskflow/utils";
import { activeTasks } from "@/lib/demos/taskflow/store/selectors/projectSelectors";
import { formatActivityMessage } from "@/lib/demos/taskflow/store/activity";

export function recentActivity(activity: ActivityItem[], limit = 12) {
  return [...activity]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

export function describeActivity(item: ActivityItem) {
  return formatActivityMessage(item);
}

export function upcomingDeadlines(tasks: Task[], limit = 5) {
  const today = todayDateOnly();
  return [...activeTasks(tasks)]
    .filter((task) => task.status !== "done" && task.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
}

export function tasksForDate(tasks: Task[], iso: string) {
  return activeTasks(tasks).filter((task) => task.dueDate === iso);
}

export function findTask(tasks: Task[], id: string) {
  return tasks.find((task) => task.id === id && !task.archived);
}
