"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskflowFetch } from "@/lib/demos/taskflow/api/client";
import type { WorkspaceMemberWithProfile } from "@/lib/demos/taskflow/api/mappers";
import { taskflowKeys } from "@/lib/demos/taskflow/queries/workspaceKeys";
import type { WorkspaceMemberRow, WorkspaceRole } from "@/server/taskflow/types/database";

export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery({
    queryKey: taskflowKeys.members(workspaceId ?? "none"),
    enabled: Boolean(workspaceId),
    queryFn: () =>
      taskflowFetch<WorkspaceMemberWithProfile[]>(
        `/api/taskflow/workspaces/${workspaceId}/members`,
      ),
  });
}

export function useUpdateMemberRole(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: Exclude<WorkspaceRole, "owner">;
    }) =>
      taskflowFetch<WorkspaceMemberRow>(
        `/api/taskflow/workspaces/${workspaceId}/members/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ role }),
        },
      ),
    onMutate: async ({ userId, role }) => {
      if (!workspaceId) return;
      const key = taskflowKeys.members(workspaceId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<WorkspaceMemberWithProfile[]>(key);
      qc.setQueryData<WorkspaceMemberWithProfile[]>(key, (old) =>
        old?.map((m) => (m.user_id === userId ? { ...m, role } : m)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (!workspaceId || !context?.previous) return;
      qc.setQueryData(taskflowKeys.members(workspaceId), context.previous);
    },
    onSettled: () => {
      if (!workspaceId) return;
      void qc.invalidateQueries({ queryKey: taskflowKeys.members(workspaceId) });
      void qc.invalidateQueries({ queryKey: taskflowKeys.activity(workspaceId) });
    },
  });
}

export function useRemoveMember(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      taskflowFetch<{ workspaceId: string; userId: string }>(
        `/api/taskflow/workspaces/${workspaceId}/members/${userId}`,
        { method: "DELETE" },
      ),
    onMutate: async (userId) => {
      if (!workspaceId) return;
      const key = taskflowKeys.members(workspaceId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<WorkspaceMemberWithProfile[]>(key);
      qc.setQueryData<WorkspaceMemberWithProfile[]>(key, (old) =>
        old?.filter((m) => m.user_id !== userId),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (!workspaceId || !context?.previous) return;
      qc.setQueryData(taskflowKeys.members(workspaceId), context.previous);
    },
    onSettled: () => {
      if (!workspaceId) return;
      void qc.invalidateQueries({ queryKey: taskflowKeys.members(workspaceId) });
      void qc.invalidateQueries({ queryKey: taskflowKeys.activity(workspaceId) });
    },
  });
}
