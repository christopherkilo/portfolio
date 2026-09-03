import type { QueuedMutationType } from "./queued-mutation";

/**
 * React `mutationQueue.ts` safe types. Angular only queues types that
 * exist in this app at Phase 7.
 */
export const REACT_SAFE_OFFLINE_TYPES = [
  "task_update",
  "task_status",
  "comment_create",
  "notification_read",
] as const;

export const ANGULAR_QUEUEABLE_TYPES: ReadonlySet<QueuedMutationType> = new Set([
  "task_update",
  "task_status",
]);

/**
 * Unified unsafe set (React `mutationQueue` + `safeMutations` strings,
 * plus Angular mutations that must stay online-only).
 */
export const UNSAFE_OFFLINE_ACTIONS = new Set([
  "member_role",
  "role_change",
  "member_remove",
  "invitation_accept",
  "invitation_create",
  "invitation_revoke",
  "attachment_delete",
  "attachment_upload",
  "comment_update",
  "comment_delete",
  "destructive_delete",
  "ownership_change",
  "task_create",
  "task_delete",
  "task_assign",
  "project_create",
  "project_update",
  "project_archive",
  "comment_create",
  "notification_read",
  "notification_preferences",
]);

export const OFFLINE_UNSAFE_CODE = "OFFLINE_UNSAFE_ACTION";
export const OFFLINE_UNSAFE_MESSAGE = "This action needs an active connection.";
export const PROJECT_OFFLINE_MESSAGE = "Project changes need an active connection.";
export const QUEUED_SAVE_MESSAGE = "Saved locally — waiting to sync";

export function isAngularQueueable(
  type: string,
): type is QueuedMutationType {
  return ANGULAR_QUEUEABLE_TYPES.has(type as QueuedMutationType);
}

export function isUnsafeOfflineAction(action: string): boolean {
  return UNSAFE_OFFLINE_ACTIONS.has(action);
}

export function taskQueueType(body: Record<string, unknown>): QueuedMutationType {
  const keys = Object.keys(body).filter((key) => key !== "expectedVersion");
  if (keys.length === 1 && keys[0] === "status") return "task_status";
  return "task_update";
}
