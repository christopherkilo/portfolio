export const taskflowKeys = {
  all: ["taskflow"] as const,
  me: ["taskflow", "me"] as const,
  workspaces: ["taskflow", "workspaces"] as const,
  projects: (workspaceId: string) =>
    ["taskflow", "projects", workspaceId] as const,
  tasks: (workspaceId: string) => ["taskflow", "tasks", workspaceId] as const,
  members: (workspaceId: string) =>
    ["taskflow", "members", workspaceId] as const,
  activity: (workspaceId: string) =>
    ["taskflow", "activity", workspaceId] as const,
  comments: (taskId: string) => ["taskflow", "comments", taskId] as const,
  assignees: (taskId: string) => ["taskflow", "assignees", taskId] as const,
  invitations: (workspaceId: string) =>
    ["taskflow", "invitations", workspaceId] as const,
  notifications: ["taskflow", "notifications"] as const,
};

export const workspaceKeys = taskflowKeys;
