export type QueuedMutationType = "task_update" | "task_status";

export type QueuedMutationStatus = "pending" | "failed" | "conflict";

/**
 * Durable outbox record. Reconstructs one approved HTTP mutation.
 * No tokens, cookies, or secrets.
 */
export type QueuedMutation = {
  id: string;
  type: QueuedMutationType;
  userId: string;
  workspaceId: string;
  entityId: string;
  payload: Record<string, unknown>;
  expectedVersion?: number;
  createdAt: string;
  retryCount: number;
  status: QueuedMutationStatus;
  errorMessage?: string;
  latest?: unknown;
};

export type OfflineQueueCounts = {
  pending: number;
  failed: number;
  conflicted: number;
  totalNeedsAttention: number;
};

export type EnqueueMutationInput = {
  type: QueuedMutationType;
  userId: string;
  workspaceId: string;
  entityId: string;
  payload: Record<string, unknown>;
  expectedVersion?: number;
};

export function computeOfflineQueueCounts(
  items: QueuedMutation[],
): OfflineQueueCounts {
  const pending = items.filter((item) => item.status === "pending").length;
  const failed = items.filter((item) => item.status === "failed").length;
  const conflicted = items.filter((item) => item.status === "conflict").length;
  return {
    pending,
    failed,
    conflicted,
    totalNeedsAttention: failed + conflicted,
  };
}

export function sortQueuedMutations(items: QueuedMutation[]): QueuedMutation[] {
  return [...items].sort((a, b) => {
    const byTime = a.createdAt.localeCompare(b.createdAt);
    if (byTime !== 0) return byTime;
    return a.id.localeCompare(b.id);
  });
}
