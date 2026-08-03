"use client";

/**
 * Phase 3 Realtime entry — delegates to RealtimeManager.
 * Optimistic mutations update the cache first; realtime invalidation reconciles.
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { taskflowKeys } from "@/lib/demos/taskflow/queries/workspaceKeys";
import {
  taskflowRealtimeManager,
  type PresenceUser,
} from "@/lib/demos/taskflow/realtime/RealtimeManager";
import { useTaskflowUiStore } from "@/lib/demos/taskflow/store";
import { replayQueuedMutations } from "@/lib/demos/taskflow/offline/replay";

export function useTaskflowRealtime(
  workspaceId: string | null,
  userId?: string | null,
  self?: {
    displayName: string;
    avatarUrl?: string | null;
    currentView?: string;
  },
) {
  const qc = useQueryClient();
  const setConnectionStatus = useTaskflowUiStore((s) => s.setConnectionStatus);
  const setPresenceUsers = useTaskflowUiStore((s) => s.setPresenceUsers);

  useEffect(() => {
    if (!workspaceId || !userId) return;

    const invalidateWorkspace = () => {
      void qc.invalidateQueries({ queryKey: taskflowKeys.tasks(workspaceId) });
      void qc.invalidateQueries({
        queryKey: taskflowKeys.projects(workspaceId),
      });
      void qc.invalidateQueries({
        queryKey: taskflowKeys.activity(workspaceId),
      });
      void qc.invalidateQueries({
        queryKey: taskflowKeys.members(workspaceId),
      });
      void qc.invalidateQueries({ queryKey: taskflowKeys.notifications });
    };

    taskflowRealtimeManager.setHandlers({
      onStatus: setConnectionStatus,
      onPresence: setPresenceUsers,
      onReconnectSuccess: () => {
        invalidateWorkspace();
        void replayQueuedMutations();
      },
      onInvalidate: (table, payload) => {
        if (table === "notifications") {
          void qc.invalidateQueries({ queryKey: taskflowKeys.notifications });
          return;
        }
        void qc.invalidateQueries({ queryKey: taskflowKeys.tasks(workspaceId) });
        void qc.invalidateQueries({
          queryKey: taskflowKeys.activity(workspaceId),
        });
        if (table === "workspace_members") {
          void qc.invalidateQueries({
            queryKey: taskflowKeys.members(workspaceId),
          });
        }
        if (table === "comments" && typeof payload.task_id === "string") {
          void qc.invalidateQueries({
            queryKey: taskflowKeys.comments(payload.task_id),
          });
        }
        if (table === "task_assignees" && typeof payload.task_id === "string") {
          void qc.invalidateQueries({
            queryKey: taskflowKeys.assignees(payload.task_id),
          });
        }
        if (table === "task_attachments" && typeof payload.task_id === "string") {
          void qc.invalidateQueries({
            queryKey: ["taskflow", "attachments", payload.task_id],
          });
        }
        if (table === "projects") {
          void qc.invalidateQueries({
            queryKey: taskflowKeys.projects(workspaceId),
          });
        }
      },
    });

    void taskflowRealtimeManager.start(workspaceId, userId, {
      userId,
      displayName: self?.displayName ?? "User",
      avatarUrl: self?.avatarUrl ?? null,
      workspaceId,
      currentView: self?.currentView,
      currentEntityId: null,
    });

    const onOffline = () => taskflowRealtimeManager.notifyBrowserOffline();
    const onOnline = () => taskflowRealtimeManager.notifyBrowserOnline();
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      void taskflowRealtimeManager.stop();
    };
  }, [
    workspaceId,
    userId,
    self?.displayName,
    self?.avatarUrl,
    self?.currentView,
    qc,
    setConnectionStatus,
    setPresenceUsers,
  ]);
}

export type { PresenceUser };
