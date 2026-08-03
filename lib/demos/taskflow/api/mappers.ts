import type {
  ActivityItem,
  Priority,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  TeamMember,
} from "@/lib/demos/taskflow/data";
import type {
  ActivityEventRow,
  ProfileRow,
  ProjectRow,
  TaskRow,
  WorkspaceMemberRow,
  WorkspaceRow,
} from "@/server/taskflow/types/database";

export type WorkspaceMemberWithProfile = WorkspaceMemberRow & {
  profile?: ProfileRow;
};

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status as ProjectStatus,
    progress: 0,
    dueDate: row.due_date ?? "",
    members: [],
    color: row.color,
    taskCount: 0,
    archived: Boolean(row.archived_at),
    version: row.version ?? 1,
  };
}

export function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as Priority,
    projectId: row.project_id,
    assigneeId: row.assignee_id ?? "",
    dueDate: row.due_date ?? "",
    labels: row.labels ?? [],
    estimate: row.estimate ?? undefined,
    archived: Boolean(row.archived_at),
    version: row.version ?? 1,
  };
}

export function mapMember(row: WorkspaceMemberWithProfile): TeamMember {
  const profile = row.profile;
  const name = profile?.display_name || profile?.email || "Member";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: row.user_id,
    name,
    role: row.role,
    email: profile?.email ?? "",
    avatar: initials || "TF",
    status: "online",
  };
}

export function mapActivity(row: ActivityEventRow): ActivityItem {
  return {
    id: row.id,
    userId: row.actor_id ?? "",
    action: row.action,
    target: row.entity_title ?? row.summary,
    timestamp: row.created_at,
    entityType:
      row.entity_type === "task" ||
      row.entity_type === "project" ||
      row.entity_type === "member" ||
      row.entity_type === "workspace"
        ? row.entity_type
        : "workspace",
    entityId: row.entity_id ?? undefined,
    entityTitle: row.entity_title ?? undefined,
    oldValue: row.old_value ?? undefined,
    newValue: row.new_value ?? undefined,
    summary: row.summary,
  };
}

export type { WorkspaceRow, ProjectRow, TaskRow, ActivityEventRow };
