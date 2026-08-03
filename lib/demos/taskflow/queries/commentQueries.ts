"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskflowFetch } from "@/lib/demos/taskflow/api/client";
import { taskflowKeys } from "@/lib/demos/taskflow/queries/workspaceKeys";
import type { CommentRow, ProfileRow } from "@/server/taskflow/types/database";

export type CommentWithAuthor = CommentRow & {
  author?: ProfileRow | null;
};

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: taskflowKeys.comments(taskId ?? "none"),
    enabled: Boolean(taskId),
    queryFn: () =>
      taskflowFetch<CommentWithAuthor[]>(
        `/api/taskflow/tasks/${taskId}/comments`,
      ),
  });
}

export function useCreateComment(
  taskId: string | null,
  workspaceId?: string | null,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      taskflowFetch<CommentRow>(`/api/taskflow/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onMutate: async (body) => {
      if (!taskId) return;
      const key = taskflowKeys.comments(taskId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<CommentWithAuthor[]>(key);
      const me = qc.getQueryData<{
        id: string;
        email: string | null;
        profile: { display_name: string; avatar_url: string | null };
      }>(taskflowKeys.me);

      const now = new Date().toISOString();
      const optimistic: CommentWithAuthor = {
        id: `optimistic-${crypto.randomUUID()}`,
        workspace_id: workspaceId ?? previous?.[0]?.workspace_id ?? "",
        task_id: taskId,
        author_id: me?.id ?? "",
        body,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        author: me
          ? {
              id: me.id,
              email: me.email,
              display_name: me.profile.display_name,
              avatar_url: me.profile.avatar_url,
              created_at: now,
              updated_at: now,
            }
          : null,
      };

      qc.setQueryData<CommentWithAuthor[]>(key, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (!taskId || !context?.previous) return;
      qc.setQueryData(taskflowKeys.comments(taskId), context.previous);
    },
    onSettled: () => {
      if (!taskId) return;
      void qc.invalidateQueries({ queryKey: taskflowKeys.comments(taskId) });
      if (workspaceId) {
        void qc.invalidateQueries({
          queryKey: taskflowKeys.activity(workspaceId),
        });
      }
    },
  });
}

export function useUpdateComment(taskId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      taskflowFetch<CommentRow>(`/api/taskflow/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      if (!taskId) return;
      void qc.invalidateQueries({ queryKey: taskflowKeys.comments(taskId) });
    },
  });
}

export function useDeleteComment(
  taskId: string | null,
  workspaceId?: string | null,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      taskflowFetch<CommentRow>(`/api/taskflow/comments/${commentId}`, {
        method: "DELETE",
      }),
    onMutate: async (commentId) => {
      if (!taskId) return;
      const key = taskflowKeys.comments(taskId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<CommentWithAuthor[]>(key);
      qc.setQueryData<CommentWithAuthor[]>(key, (old) =>
        old?.filter((c) => c.id !== commentId),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (!taskId || !context?.previous) return;
      qc.setQueryData(taskflowKeys.comments(taskId), context.previous);
    },
    onSettled: () => {
      if (!taskId) return;
      void qc.invalidateQueries({ queryKey: taskflowKeys.comments(taskId) });
      if (workspaceId) {
        void qc.invalidateQueries({
          queryKey: taskflowKeys.activity(workspaceId),
        });
      }
    },
  });
}
