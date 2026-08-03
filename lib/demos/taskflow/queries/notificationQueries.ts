"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskflowFetch } from "@/lib/demos/taskflow/api/client";
import { taskflowKeys } from "@/lib/demos/taskflow/queries/workspaceKeys";
import type { NotificationRow } from "@/server/taskflow/types/database";

export function useNotifications() {
  return useQuery({
    queryKey: taskflowKeys.notifications,
    queryFn: () =>
      taskflowFetch<NotificationRow[]>("/api/taskflow/notifications"),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      taskflowFetch<NotificationRow>(
        `/api/taskflow/notifications/${notificationId}/read`,
        { method: "PATCH" },
      ),
    onMutate: async (notificationId) => {
      await qc.cancelQueries({ queryKey: taskflowKeys.notifications });
      const previous = qc.getQueryData<NotificationRow[]>(
        taskflowKeys.notifications,
      );
      const readAt = new Date().toISOString();
      qc.setQueryData<NotificationRow[]>(taskflowKeys.notifications, (old) =>
        old?.map((n) =>
          n.id === notificationId ? { ...n, read_at: n.read_at ?? readAt } : n,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (!context?.previous) return;
      qc.setQueryData(taskflowKeys.notifications, context.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: taskflowKeys.notifications });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      taskflowFetch<{ count: number }>(
        "/api/taskflow/notifications/read-all",
        { method: "POST" },
      ),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: taskflowKeys.notifications });
      const previous = qc.getQueryData<NotificationRow[]>(
        taskflowKeys.notifications,
      );
      const readAt = new Date().toISOString();
      qc.setQueryData<NotificationRow[]>(taskflowKeys.notifications, (old) =>
        old?.map((n) => ({ ...n, read_at: n.read_at ?? readAt })),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (!context?.previous) return;
      qc.setQueryData(taskflowKeys.notifications, context.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: taskflowKeys.notifications });
    },
  });
}
