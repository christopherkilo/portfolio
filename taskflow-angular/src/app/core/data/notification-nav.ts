const TASK_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type NotificationNavTarget = {
  entityType: string;
  entityId: string | null;
};

/** Only internal task detail. Never follow arbitrary URLs from payloads. */
export function notificationTaskId(
  item: NotificationNavTarget,
): string | null {
  if (item.entityType !== "task") return null;
  const id = item.entityId?.trim() ?? "";
  if (!id || !TASK_ID.test(id)) return null;
  return id;
}
