"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskflowFetch } from "@/lib/demos/taskflow/api/client";
import { taskflowKeys } from "@/lib/demos/taskflow/queries/workspaceKeys";
import type { TaskAssigneeRow, TaskRow } from "@/server/taskflow/types/database";

function invalidateAssignRelated(
  qc: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  taskId: string,
) {
  void qc.invalidateQueries({ queryKey: taskflowKeys.tasks(workspaceId) });
  void qc.invalidateQueries({ queryKey: taskflowKeys.members(workspaceId) });
  void qc.invalidateQueries({ queryKey: taskflowKeys.activity(workspaceId) });
  void qc.invalidateQueries({ queryKey: taskflowKeys.assignees(taskId) });
}

export function useAssignTask(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      taskflowFetch<TaskAssigneeRow>(
        `/api/taskflow/tasks/${taskId}/assignees`,
        {
          method: "POST",
          body: JSON.stringify({ userId }),
        },
      ),
    onMutate: async ({ taskId, userId }) => {
      if (!workspaceId) return;
      const tasksKey = taskflowKeys.tasks(workspaceId);
      const assigneesKey = taskflowKeys.assignees(taskId);
      await Promise.all([
        qc.cancelQueries({ queryKey: tasksKey }),
        qc.cancelQueries({ queryKey: assigneesKey }),
      ]);
      const previousTasks = qc.getQueryData<TaskRow[]>(tasksKey);
      const previousAssignees = qc.getQueryData<TaskAssigneeRow[]>(assigneesKey);

      qc.setQueryData<TaskRow[]>(tasksKey, (old) =>
        old?.map((t) =>
          t.id === taskId ? { ...t, assignee_id: userId } : t,
        ),
      );

      const now = new Date().toISOString();
      qc.setQueryData<TaskAssigneeRow[]>(assigneesKey, (old) => {
        const list = old ?? [];
        if (list.some((a) => a.user_id === userId)) return list;
        return [
          ...list,
          {
            task_id: taskId,
            user_id: userId,
            workspace_id: workspaceId,
            assigned_by: null,
            assigned_at: now,
          },
        ];
      });

      return { previousTasks, previousAssignees };
    },
    onError: (_error, vars, context) => {
      if (!workspaceId || !context) return;
      if (context.previousTasks) {
        qc.setQueryData(
          taskflowKeys.tasks(workspaceId),
          context.previousTasks,
        );
      }
      if (context.previousAssignees) {
        qc.setQueryData(
          taskflowKeys.assignees(vars.taskId),
          context.previousAssignees,
        );
      }
    },
    onSettled: (_data, _error, vars) => {
      if (!workspaceId) return;
      invalidateAssignRelated(qc, workspaceId, vars.taskId);
    },
  });
}

export function useUnassignTask(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      taskflowFetch<{ taskId: string; userId: string }>(
        `/api/taskflow/tasks/${taskId}/assignees/${userId}`,
        { method: "DELETE" },
      ),
    onMutate: async ({ taskId, userId }) => {
      if (!workspaceId) return;
      const tasksKey = taskflowKeys.tasks(workspaceId);
      const assigneesKey = taskflowKeys.assignees(taskId);
      await Promise.all([
        qc.cancelQueries({ queryKey: tasksKey }),
        qc.cancelQueries({ queryKey: assigneesKey }),
      ]);
      const previousTasks = qc.getQueryData<TaskRow[]>(tasksKey);
      const previousAssignees = qc.getQueryData<TaskAssigneeRow[]>(assigneesKey);

      const nextAssignees = (previousAssignees ?? []).filter(
        (a) => a.user_id !== userId,
      );
      qc.setQueryData<TaskAssigneeRow[]>(assigneesKey, nextAssignees);
      qc.setQueryData<TaskRow[]>(tasksKey, (old) =>
        old?.map((t) => {
          if (t.id !== taskId) return t;
          if (t.assignee_id !== userId) return t;
          return {
            ...t,
            assignee_id: nextAssignees[0]?.user_id ?? null,
          };
        }),
      );

      return { previousTasks, previousAssignees };
    },
    onError: (_error, vars, context) => {
      if (!workspaceId || !context) return;
      if (context.previousTasks) {
        qc.setQueryData(
          taskflowKeys.tasks(workspaceId),
          context.previousTasks,
        );
      }
      if (context.previousAssignees) {
        qc.setQueryData(
          taskflowKeys.assignees(vars.taskId),
          context.previousAssignees,
        );
      }
    },
    onSettled: (_data, _error, vars) => {
      if (!workspaceId) return;
      invalidateAssignRelated(qc, workspaceId, vars.taskId);
    },
  });
}
