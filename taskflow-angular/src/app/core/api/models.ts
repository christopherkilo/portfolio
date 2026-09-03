export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";
export type ProjectStatus = "active" | "planning" | "paused" | "done";
export type TaskStatus =
  | "backlog"
  | "todo"
  | "in-progress"
  | "review"
  | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

/** GET /api/workspaces row (API shape). */
export type Workspace = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

/** GET /api/projects row before UI mapping. */
export type ProjectRow = {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  version: number;
};

/** GET /api/tasks row before UI mapping. */
export type TaskRow = {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  labels: string[];
  estimate: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  version: number;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
};

export type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  profile?: ProfileRow;
};

export type ActivityEventRow = {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  old_value: string | null;
  new_value: string | null;
  summary: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  changes?: Record<string, unknown>;
};

export type CommentAuthor = {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
};

export type CommentWithAuthor = {
  id: string;
  workspace_id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author?: CommentAuthor | null;
};

/** API attachment row. Do not copy `storage_path` into UI models. */
export type TaskAttachmentRow = {
  id: string;
  workspace_id: string;
  task_id: string;
  uploaded_by: string;
  storage_path?: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  status: "pending" | "ready" | "failed" | "deleted";
  created_at: string;
};

export type TaskAttachment = {
  id: string;
  taskId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  type: string;
  entity_type: string;
  entity_id: string | null;
  actor_id: string | null;
  title: string;
  message: string;
  occurrence_count: number;
  last_occurred_at: string;
  read_at: string | null;
  created_at: string;
};

export type TaskflowNotification = {
  id: string;
  type: string;
  entityType: string;
  entityId: string | null;
  title: string;
  message: string;
  occurrenceCount: number;
  lastOccurredAt: string;
  createdAt: string;
  readAt: string | null;
};

export type NotificationPreferenceRow = {
  user_id: string;
  assignments: boolean;
  comments: boolean;
  mentions: boolean;
  due_dates: boolean;
  project_changes: boolean;
  updated_at: string;
};

/** Mapped UI project (same fields React `mapProject` produces). */
export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  members: string[];
  color: string;
  taskCount: number;
  archived: boolean;
  version: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  dueDate: string;
  labels: string[];
  estimate?: number;
  archived: boolean;
  version: number;
};

export type TeamMember = {
  id: string;
  name: string;
  role: WorkspaceRole;
  email: string;
  avatar: string;
};

export type PendingInvitation = {
  id: string;
  workspace_id: string;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  expires_at: string;
  created_at: string;
};

export type WorkspaceInvitationRow = PendingInvitation & {
  invited_by: string;
  accepted_at: string | null;
  revoked_at: string | null;
  token_hash?: string;
};

export type ActivityItem = {
  id: string;
  userId: string;
  action: string;
  target: string;
  timestamp: string;
  entityType: "task" | "project" | "member" | "workspace";
  entityId?: string;
  entityTitle?: string;
  oldValue?: string;
  newValue?: string;
  summary?: string;
};

export const TASK_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Todo" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

export const DEMO_WORKSPACE_NAME = "Portfolio Demo Workspace";
