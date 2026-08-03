"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskflowFetch } from "@/lib/demos/taskflow/api/client";
import {
  mapActivity,
  mapMember,
  mapProject,
  mapTask,
  type WorkspaceMemberWithProfile,
} from "@/lib/demos/taskflow/api/mappers";
import { taskflowKeys } from "@/lib/demos/taskflow/queries/workspaceKeys";
import { useTaskflowUiStore } from "@/lib/demos/taskflow/store/ui";
import type {
  ActivityEventRow,
  ProjectRow,
  TaskRow,
  WorkspaceRow,
} from "@/server/taskflow/types/database";

export { taskflowKeys };
export {
  useWorkspaceMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useTaskComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  usePendingInvitations,
  useInviteMember,
  useRevokeInvitation,
  useAcceptInvitation,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useAssignTask,
  useUnassignTask,
} from "@/lib/demos/taskflow/queries";

export function useTaskflowMe() {
  return useQuery({
    queryKey: taskflowKeys.me,
    queryFn: () =>
      taskflowFetch<{
        id: string;
        email: string | null;
        profile: { display_name: string; avatar_url: string | null };
      }>("/api/me"),
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        "status" in error &&
        (error as { status?: number }).status === 401
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useWorkspacesQuery() {
  return useQuery({
    queryKey: taskflowKeys.workspaces,
    queryFn: () => taskflowFetch<WorkspaceRow[]>("/api/workspaces"),
  });
}

const DEMO_WORKSPACE_NAME = "Portfolio Demo Workspace";

function pickActiveWorkspace<T extends { id: string; name: string }>(
  list: T[] | undefined,
  preferredId: string | null,
): T | null {
  if (!list?.length) return null;
  if (preferredId) {
    const preferred = list.find((row) => row.id === preferredId);
    if (preferred) return preferred;
  }
  const demo = list.find((row) => row.name === DEMO_WORKSPACE_NAME);
  if (demo) return demo;
  return list[0] ?? null;
}

export function useActiveWorkspaceId() {
  const workspaces = useWorkspacesQuery();
  const preferredId = useTaskflowUiStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useTaskflowUiStore((s) => s.setActiveWorkspaceId);
  const workspace = pickActiveWorkspace(workspaces.data, preferredId);

  useEffect(() => {
    if (!workspace) return;
    if (preferredId !== workspace.id) {
      setActiveWorkspaceId(workspace.id);
    }
  }, [workspace, preferredId, setActiveWorkspaceId]);

  return {
    ...workspaces,
    workspaceId: workspace?.id ?? null,
    workspace,
    workspaces: workspaces.data ?? [],
    setWorkspaceId: setActiveWorkspaceId,
  };
}

export function useProjectsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: taskflowKeys.projects(workspaceId ?? "none"),
    enabled: Boolean(workspaceId),
    queryFn: () =>
      taskflowFetch<ProjectRow[]>(
        `/api/projects?workspaceId=${encodeURIComponent(workspaceId!)}`,
      ),
    select: (rows) => rows.map(mapProject),
  });
}

export function useTasksQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: taskflowKeys.tasks(workspaceId ?? "none"),
    enabled: Boolean(workspaceId),
    queryFn: () =>
      taskflowFetch<TaskRow[]>(
        `/api/tasks?workspaceId=${encodeURIComponent(workspaceId!)}`,
      ),
    select: (rows) => rows.map(mapTask),
  });
}

export function useMembersQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: taskflowKeys.members(workspaceId ?? "none"),
    enabled: Boolean(workspaceId),
    queryFn: () =>
      taskflowFetch<WorkspaceMemberWithProfile[]>(
        `/api/members?workspaceId=${encodeURIComponent(workspaceId!)}`,
      ),
    select: (rows) => rows.map(mapMember),
  });
}

export function useActivityQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: taskflowKeys.activity(workspaceId ?? "none"),
    enabled: Boolean(workspaceId),
    queryFn: () =>
      taskflowFetch<ActivityEventRow[]>(
        `/api/activity?workspaceId=${encodeURIComponent(workspaceId!)}`,
      ),
    select: (rows) => rows.map(mapActivity),
  });
}

export function useWorkspaceData() {
  const active = useActiveWorkspaceId();
  const projects = useProjectsQuery(active.workspaceId);
  const tasks = useTasksQuery(active.workspaceId);
  const members = useMembersQuery(active.workspaceId);
  const activity = useActivityQuery(active.workspaceId);

  const isLoading =
    active.isLoading ||
    projects.isLoading ||
    tasks.isLoading ||
    members.isLoading ||
    activity.isLoading;
  const isError =
    active.isError ||
    projects.isError ||
    tasks.isError ||
    members.isError ||
    activity.isError;
  const error =
    active.error ||
    projects.error ||
    tasks.error ||
    members.error ||
    activity.error;

  return {
    workspaceId: active.workspaceId,
    workspace: active.workspace,
    projects: projects.data ?? [],
    tasks: tasks.data ?? [],
    members: members.data ?? [],
    activity: activity.data ?? [],
    isLoading,
    isError,
    error,
    refetch: async () => {
      await Promise.all([
        active.refetch(),
        projects.refetch(),
        tasks.refetch(),
        members.refetch(),
        activity.refetch(),
      ]);
    },
  };
}

function invalidateWorkspace(qc: ReturnType<typeof useQueryClient>, workspaceId: string) {
  void qc.invalidateQueries({ queryKey: taskflowKeys.projects(workspaceId) });
  void qc.invalidateQueries({ queryKey: taskflowKeys.tasks(workspaceId) });
  void qc.invalidateQueries({ queryKey: taskflowKeys.activity(workspaceId) });
  void qc.invalidateQueries({ queryKey: taskflowKeys.members(workspaceId) });
}

export function useCreateTaskMutation(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      taskflowFetch<TaskRow>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      if (workspaceId) invalidateWorkspace(qc, workspaceId);
    },
  });
}

export function useUpdateTaskMutation(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      expectedVersion,
      ...body
    }: {
      id: string;
      expectedVersion: number;
    } & Record<string, unknown>) => {
      if (!workspaceId) {
        throw new Error("No active workspace.");
      }
      const { patchTaskWithVersion } = await import(
        "@/lib/demos/taskflow/offline/safeMutations"
      );
      const keys = Object.keys(body);
      return patchTaskWithVersion({
        id,
        workspaceId,
        expectedVersion,
        body,
        allowStatusAutoReconcile:
          keys.length === 1 && keys[0] === "status",
      });
    },
    onSuccess: () => {
      if (workspaceId) invalidateWorkspace(qc, workspaceId);
    },
  });
}

export function useDeleteTaskMutation(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      taskflowFetch<{ id: string }>(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      if (workspaceId) invalidateWorkspace(qc, workspaceId);
    },
  });
}

export function useCreateProjectMutation(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      taskflowFetch<ProjectRow>("/api/projects", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      if (workspaceId) invalidateWorkspace(qc, workspaceId);
    },
  });
}

export function useUpdateProjectMutation(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      expectedVersion,
      ...body
    }: {
      id: string;
      expectedVersion: number;
    } & Record<string, unknown>) => {
      const { patchProjectWithVersion } = await import(
        "@/lib/demos/taskflow/offline/safeMutations"
      );
      return patchProjectWithVersion({ id, expectedVersion, body });
    },
    onSuccess: () => {
      if (workspaceId) invalidateWorkspace(qc, workspaceId);
    },
  });
}
