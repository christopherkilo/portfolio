import "server-only";

import { createTaskflowContext } from "@/server/taskflow/auth/authorization";
import { NotificationNotFoundError } from "@/server/taskflow/errors";
import type { NotificationType } from "@/server/taskflow/types/database";

/**
 * Best-effort notification creation.
 * Failures are logged and swallowed so core mutations can still succeed.
 * Actor is always derived from auth.uid() inside the SECURITY DEFINER RPC.
 */
export async function notifyUser(input: {
  userId: string;
  workspaceId: string;
  type: NotificationType;
  entityType: string;
  entityId?: string | null;
  /** Ignored — RPC uses auth.uid(). Kept for call-site compatibility. */
  actorId?: string | null;
  title: string;
  message?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string | null;
  groupKey?: string | null;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const ctx = await createTaskflowContext();
    await ctx.notifications.createViaRpc({
      user_id: input.userId,
      workspace_id: input.workspaceId,
      type: input.type,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      title: input.title,
      message: input.message ?? "",
      metadata: input.metadata ?? {},
      dedupe_key: input.dedupeKey ?? null,
      group_key: input.groupKey ?? null,
    });
    return { ok: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    console.error("[taskflow-notification]", {
      type: input.type,
      workspaceId: input.workspaceId,
      userId: input.userId,
      reason,
    });
    return { ok: false, reason: "notification_failed" };
  }
}

export async function listNotifications() {
  const ctx = await createTaskflowContext();
  return ctx.notifications.listForUser(ctx.user.id);
}

export async function markNotificationRead(notificationId: string) {
  const ctx = await createTaskflowContext();
  try {
    return await ctx.notifications.markRead(notificationId, ctx.user.id);
  } catch {
    throw new NotificationNotFoundError();
  }
}

export async function markAllNotificationsRead() {
  const ctx = await createTaskflowContext();
  const count = await ctx.notifications.markAllRead(ctx.user.id);
  return { count };
}
