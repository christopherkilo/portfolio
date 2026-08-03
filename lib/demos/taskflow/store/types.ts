import type {
  ActivityItem,
  Priority,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  TeamMember,
} from "@/lib/demos/taskflow/data";

export type {
  ActivityItem,
  Priority,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  TeamMember,
};

export type WorkspaceSettings = {
  density: "comfortable" | "compact";
  emailNotifs: boolean;
  pushNotifs: boolean;
  weekStart: "monday" | "sunday";
  displayName: string;
  email: string;
};

export type TaskDraft = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  assigneeId: string;
  dueDate: string;
  labels: string[];
  estimate?: number;
};

export type ProjectDraft = {
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  members: string[];
  color: string;
};

export type WorkspaceUiMode = "board" | "list";

export type UndoSnapshot = {
  tasks: Task[];
  message: string;
} | null;

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  density: "comfortable",
  emailNotifs: true,
  pushNotifs: false,
  weekStart: "monday",
  displayName: "Maya Chen",
  email: "maya@taskflow.app",
};

export const WORKSPACE_STORAGE_KEY = "taskflow-workspace-v1";
export const WORKSPACE_STORAGE_VERSION = 2;
