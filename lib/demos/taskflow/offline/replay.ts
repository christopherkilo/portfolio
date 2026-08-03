"use client";

import { taskflowFetch, TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import {
  computeOfflineQueueCounts,
  listQueuedMutations,
  removeQueuedMutation,
  updateQueuedMutation,
} from "@/lib/demos/taskflow/offline/mutationQueue";
import { useTaskflowUiStore } from "@/lib/demos/taskflow/store";

function syncCounts() {
  return listQueuedMutations().then((items) => {
    useTaskflowUiStore
      .getState()
      .setOfflineQueueCounts(computeOfflineQueueCounts(items));
  });
}

export async function replayQueuedMutations() {
  const items = await listQueuedMutations();
  const pending = items
    .filter((i) => i.status === "pending" || i.status === "failed")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const item of pending) {
    try {
      if (item.type === "task_update" || item.type === "task_status") {
        await taskflowFetch(`/api/tasks/${item.entityId}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...item.payload,
            expectedVersion: item.expectedVersion,
          }),
        });
      } else if (item.type === "comment_create") {
        await taskflowFetch(
          `/api/taskflow/tasks/${item.entityId}/comments`,
          {
            method: "POST",
            body: JSON.stringify(item.payload),
          },
        );
      } else if (item.type === "notification_read") {
        await taskflowFetch(
          `/api/taskflow/notifications/${item.entityId}/read`,
          { method: "PATCH" },
        );
      }
      await removeQueuedMutation(item.id);
    } catch (error) {
      if (error instanceof TaskflowApiError && error.status === 409) {
        await updateQueuedMutation(item.id, {
          status: "conflict",
          errorMessage: error.message,
          retryCount: item.retryCount + 1,
        });
        const latest = error.data?.latest ?? null;
        const latestRecord =
          latest && typeof latest === "object"
            ? (latest as Record<string, unknown>)
            : null;
        useTaskflowUiStore.getState().setConflictDraft({
          queuedMutationId: item.id,
          entityType: "task",
          entityId: item.entityId,
          draft: item.payload,
          expectedVersion: item.expectedVersion,
          latestVersion:
            typeof latestRecord?.version === "number"
              ? latestRecord.version
              : undefined,
          latest,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
        await syncCounts();
        break;
      }
      await updateQueuedMutation(item.id, {
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Replay failed",
        retryCount: item.retryCount + 1,
      });
      await syncCounts();
      break;
    }
  }

  await syncCounts();
}
