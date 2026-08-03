"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskflowFetch } from "@/lib/demos/taskflow/api/client";
import { taskflowKeys } from "@/lib/demos/taskflow/queries/workspaceKeys";
import type {
  WorkspaceInvitationRow,
  WorkspaceRole,
} from "@/server/taskflow/types/database";

export type InvitationListItem = Omit<WorkspaceInvitationRow, "token_hash">;

function stripInvitationToken(
  row: WorkspaceInvitationRow | InvitationListItem,
): InvitationListItem {
  if ("token_hash" in row) {
    const { token_hash: _, ...rest } = row;
    void _;
    return rest;
  }
  return row;
}

export type CreateInvitationResult = {
  invitation: {
    id: string;
    workspace_id: string;
    email: string;
    role: Exclude<WorkspaceRole, "owner">;
    expires_at: string;
    created_at: string;
  };
  acceptUrl?: string;
};

export function usePendingInvitations(workspaceId: string | null) {
  return useQuery({
    queryKey: taskflowKeys.invitations(workspaceId ?? "none"),
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const rows = await taskflowFetch<WorkspaceInvitationRow[]>(
        `/api/taskflow/workspaces/${workspaceId}/invitations`,
      );
      return rows.map(stripInvitationToken);
    },
  });
}

export function useInviteMember(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      email: string;
      role?: Exclude<WorkspaceRole, "owner">;
    }) =>
      taskflowFetch<CreateInvitationResult>(
        `/api/taskflow/workspaces/${workspaceId}/invitations`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      ),
    onSuccess: () => {
      if (!workspaceId) return;
      void qc.invalidateQueries({
        queryKey: taskflowKeys.invitations(workspaceId),
      });
      void qc.invalidateQueries({
        queryKey: taskflowKeys.activity(workspaceId),
      });
    },
  });
}

export function useRevokeInvitation(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      taskflowFetch<WorkspaceInvitationRow>(
        `/api/taskflow/workspaces/${workspaceId}/invitations/${invitationId}`,
        { method: "DELETE" },
      ).then(stripInvitationToken),
    onMutate: async (invitationId) => {
      if (!workspaceId) return;
      const key = taskflowKeys.invitations(workspaceId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<InvitationListItem[]>(key);
      qc.setQueryData<InvitationListItem[]>(key, (old) =>
        old?.filter((inv) => inv.id !== invitationId),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (!workspaceId || !context?.previous) return;
      qc.setQueryData(taskflowKeys.invitations(workspaceId), context.previous);
    },
    onSettled: () => {
      if (!workspaceId) return;
      void qc.invalidateQueries({
        queryKey: taskflowKeys.invitations(workspaceId),
      });
    },
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      taskflowFetch<{
        invitation_id: string;
        workspace_id: string;
        role: WorkspaceRole;
      }>("/api/taskflow/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: taskflowKeys.workspaces });
      void qc.invalidateQueries({
        queryKey: taskflowKeys.members(data.workspace_id),
      });
      void qc.invalidateQueries({
        queryKey: taskflowKeys.invitations(data.workspace_id),
      });
      void qc.invalidateQueries({
        queryKey: taskflowKeys.activity(data.workspace_id),
      });
    },
  });
}
