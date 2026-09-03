export const WORKSPACE_CHANNEL_PREFIX = "taskflow-workspace-";

export const WORKSPACE_TABLES = [
  "tasks",
  "task_assignees",
  "projects",
  "comments",
  "notifications",
  "activity_events",
  "task_attachments",
  "workspace_members",
  "workspace_invitations",
] as const;

export type WorkspaceRealtimeTable = (typeof WORKSPACE_TABLES)[number];

export function workspaceChannelName(workspaceId: string) {
  return `${WORKSPACE_CHANNEL_PREFIX}${workspaceId}`;
}
