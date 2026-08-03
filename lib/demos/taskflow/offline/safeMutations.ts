"use client";

import {
  TaskflowApiError,
  taskflowFetch,
} from "@/lib/demos/taskflow/api/client";
import { enqueueMutation } from "@/lib/demos/taskflow/offline/mutationQueue";
import { useTaskflowUiStore } from "@/lib/demos/taskflow/store";
import type { Task, TaskStatus } from "@/lib/demos/taskflow/data";
import type { TaskRow, ProjectRow } from "@/server/taskflow/types/database";
import { mapTask, mapProject } from "@/lib/demos/taskflow/api/mappers";

export function isBrowserOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function isConnectionOffline() {
  const status = useTaskflowUiStore.getState().connectionStatus;
  return isBrowserOffline() || status === "offline";
}

/** Mutations that must not run while offline. */
export const UNSAFE_OFFLINE_ACTIONS = [
  "role_change",
  "member_remove",
  "invitation_accept",
  "invitation_create",
  "destructive_delete",
  "ownership_change",
] as const;

export function assertOnlineForUnsafeAction(action: string) {
  if (isConnectionOffline()) {
    throw new TaskflowApiError(
      "This action needs an active connection.",
      { status: 503, code: "OFFLINE_UNSAFE_ACTION" },
    );
  }
  void action;
}

function bumpPendingCount() {
  void import("@/lib/demos/taskflow/offline/mutationQueue").then(
    async ({ listQueuedMutations, computeOfflineQueueCounts }) => {
      const items = await listQueuedMutations();
      useTaskflowUiStore
        .getState()
        .setOfflineQueueCounts(computeOfflineQueueCounts(items));
    },
  );
}

function handleConflict(
  error: TaskflowApiError,
  entityType: "task" | "project",
  entityId: string,
  draft: Record<string, unknown>,
) {
  if (error.status !== 409 && error.code !== "STALE_VERSION") return false;
  useTaskflowUiStore.getState().setConflictDraft({
    entityType,
    entityId,
    draft,
    latest: error.data?.latest ?? null,
    latestVersion:
      error.data?.latest &&
      typeof error.data.latest === "object" &&
      typeof (error.data.latest as { version?: unknown }).version === "number"
        ? (error.data.latest as { version: number }).version
        : undefined,
    expectedVersion:
      typeof draft.expectedVersion === "number"
        ? draft.expectedVersion
        : undefined,
    message: error.message,
    timestamp: new Date().toISOString(),
  });
  return true;
}

export async function patchTaskWithVersion(options: {
  id: string;
  workspaceId: string;
  expectedVersion: number;
  body: Record<string, unknown>;
  /** Status-only moves may auto-retry once with the latest version. */
  allowStatusAutoReconcile?: boolean;
}): Promise<Task | "queued"> {
  const { id, workspaceId, expectedVersion, body, allowStatusAutoReconcile } =
    options;
  const payload = { ...body, expectedVersion };

  if (isConnectionOffline()) {
    await enqueueMutation({
      type: body.status && Object.keys(body).length === 1
        ? "task_status"
        : "task_update",
      entityId: id,
      workspaceId,
      payload: body,
      expectedVersion,
    });
    bumpPendingCount();
    return "queued";
  }

  try {
    const row = await taskflowFetch<TaskRow>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return mapTask(row);
  } catch (error) {
    if (!(error instanceof TaskflowApiError)) throw error;

    if (
      allowStatusAutoReconcile &&
      error.code === "STALE_VERSION" &&
      typeof body.status === "string" &&
      Object.keys(body).every((k) => k === "status" || k === "expectedVersion")
    ) {
      const latest = error.data?.latest as TaskRow | undefined;
      if (latest?.version != null && latest.status !== body.status) {
        const row = await taskflowFetch<TaskRow>(`/api/tasks/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: body.status,
            expectedVersion: latest.version,
          }),
        });
        return mapTask(row);
      }
      if (latest?.status === body.status) {
        return mapTask(latest);
      }
    }

    handleConflict(error, "task", id, body);
    throw error;
  }
}

export async function patchProjectWithVersion(options: {
  id: string;
  expectedVersion: number;
  body: Record<string, unknown>;
}): Promise<ReturnType<typeof mapProject>> {
  const { id, expectedVersion, body } = options;
  if (isConnectionOffline()) {
    throw new TaskflowApiError(
      "Project changes need an active connection.",
      { status: 503, code: "OFFLINE_UNSAFE_ACTION" },
    );
  }
  try {
    const row = await taskflowFetch<ProjectRow>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...body, expectedVersion }),
    });
    return mapProject(row);
  } catch (error) {
    if (error instanceof TaskflowApiError) {
      handleConflict(error, "project", id, body);
    }
    throw error;
  }
}

export type { TaskStatus };
