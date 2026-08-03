import "server-only";

import {
  createTaskflowContext,
  requireTaskAccess,
  requireWorkspaceMember,
} from "@/server/taskflow/auth/authorization";
import {
  InvalidAssigneeError,
  InvalidWorkspaceRelationshipError,
  InternalError,
  MemberNotFoundError,
  StaleVersionError,
} from "@/server/taskflow/errors";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "@/server/taskflow/schemas";
import { TaskAssigneeRepository } from "@/server/taskflow/repositories/taskAssigneeRepository";
import { recordActivity } from "@/server/taskflow/services/activityService";
import { notifyUser } from "@/server/taskflow/services/notificationService";
import type { TaskRow } from "@/server/taskflow/types/database";

/**
 * Failure policy:
 * - Core: task + assignees (atomic via RPC / explicit validation) — required
 * - Activity audit: required for field patches (inside update_task_versioned RPC)
 * - Notifications: best-effort (logged, never fails the request after core commit)
 */

export async function listTasks(workspaceId: string, projectId?: string) {
  const { ctx } = await requireWorkspaceMember(workspaceId, "viewer");
  return ctx.tasks.listByWorkspace(workspaceId, projectId);
}

export async function createTask(input: CreateTaskInput) {
  const { ctx } = await requireWorkspaceMember(input.workspaceId, "member");

  const project = await ctx.projects.require(input.projectId);
  if (project.workspace_id !== input.workspaceId) {
    throw new InvalidWorkspaceRelationshipError(
      "Project does not belong to this workspace.",
    );
  }

  const assigneeIds = [
    ...new Set(
      [input.assigneeId, ...(input.assigneeIds ?? [])].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];

  for (const userId of assigneeIds) {
    const membership = await ctx.members.getMembership(input.workspaceId, userId);
    if (!membership) throw new InvalidAssigneeError();
  }

  const { data: task, error } = await ctx.supabase.rpc("create_task_with_assignees", {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_title: input.title,
    p_description: input.description ?? "",
    p_status: input.status ?? "backlog",
    p_priority: input.priority ?? "medium",
    p_due_date: input.dueDate ?? null,
    p_labels: input.labels ?? [],
    p_estimate: input.estimate ?? null,
    p_assignee_ids: assigneeIds,
  });

  if (error || !task) {
    const msg = error?.message ?? "";
    if (msg.includes("ASSIGNEE_NOT_MEMBER")) throw new InvalidAssigneeError();
    if (msg.includes("INVALID_PROJECT")) {
      throw new InvalidWorkspaceRelationshipError(
        "Project does not belong to this workspace.",
      );
    }
    throw new InternalError("Could not create task.");
  }

  const created = task as TaskRow;

  await recordActivity({
    workspaceId: input.workspaceId,
    actorId: ctx.user.id,
    action: "created",
    entityType: "task",
    entityId: created.id,
    entityTitle: created.title,
    summary: `created ${created.title}`,
    metadata: { assigneeIds },
  });

  for (const userId of assigneeIds) {
    if (userId === ctx.user.id) continue;
    await notifyUser({
      userId,
      workspaceId: input.workspaceId,
      type: "task_assigned",
      entityType: "task",
      entityId: created.id,
      title: "You were assigned a task",
      message: created.title,
      dedupeKey: `task_assigned:${created.id}:${userId}`,
    });
  }

  return created;
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const boot = await createTaskflowContext();
  const current = await boot.tasks.require(id);
  const { ctx } = await requireWorkspaceMember(current.workspace_id, "member");

  if (input.projectId !== undefined) {
    const project = await ctx.projects.require(input.projectId);
    if (project.workspace_id !== current.workspace_id) {
      throw new InvalidWorkspaceRelationshipError(
        "Cannot move a task to a project in another workspace.",
      );
    }
  }

  if (input.assigneeId !== undefined && input.assigneeId !== null) {
    const membership = await ctx.members.getMembership(
      current.workspace_id,
      input.assigneeId,
    );
    if (!membership) throw new InvalidAssigneeError();
  }

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.projectId !== undefined) patch.projectId = input.projectId;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate;
  if (input.labels !== undefined) patch.labels = input.labels;
  if (input.estimate !== undefined) patch.estimate = input.estimate;
  if (input.archived !== undefined) patch.archived = input.archived;

  const hasFieldPatch = Object.keys(patch).length > 0;
  const assigneeOnly =
    !hasFieldPatch && input.assigneeId !== undefined;

  let row = current;

  if (hasFieldPatch) {
    const { data: updated, error } = await ctx.supabase.rpc(
      "update_task_versioned",
      {
        p_task_id: id,
        p_expected_version: input.expectedVersion,
        p_patch: patch,
      },
    );

    if (error || !updated) {
      const msg = error?.message ?? "";
      if (msg.includes("STALE_VERSION")) {
        const latest = await ctx.tasks.getById(id);
        throw new StaleVersionError(latest);
      }
      if (msg.includes("EMPTY_PATCH") || msg.includes("INVALID_PATCH")) {
        const { InvalidPatchError } = await import("@/server/taskflow/errors");
        throw new InvalidPatchError();
      }
      if (msg.includes("INVALID_PROJECT")) {
        throw new InvalidWorkspaceRelationshipError(
          "Cannot move a task to a project in another workspace.",
        );
      }
      throw new InternalError("Could not update task.");
    }

    row = updated as TaskRow;
  } else if (!assigneeOnly) {
    const { InvalidPatchError } = await import("@/server/taskflow/errors");
    throw new InvalidPatchError("Submit at least one field to update.");
  }

  if (input.assigneeId !== undefined && input.assigneeId !== current.assignee_id) {
    if (input.assigneeId) {
      try {
        await assignTask(id, input.assigneeId);
      } catch (err) {
        const { DuplicateAssignmentError } = await import(
          "@/server/taskflow/errors"
        );
        if (!(err instanceof DuplicateAssignmentError)) throw err;
      }
    } else {
      const assignees = new TaskAssigneeRepository(ctx.supabase);
      const existing = await assignees.listByTask(id);
      for (const item of existing) {
        await assignees.unassign(id, item.user_id);
      }
      await recordActivity({
        workspaceId: current.workspace_id,
        actorId: ctx.user.id,
        action: "unassigned",
        entityType: "task",
        entityId: id,
        entityTitle: row.title,
        summary: `unassigned ${row.title}`,
      });
    }
  }

  // Audit for field patches is written atomically inside update_task_versioned.
  return row;
}

export async function deleteTask(id: string) {
  const boot = await createTaskflowContext();
  const current = await boot.tasks.require(id);
  const { ctx } = await requireWorkspaceMember(current.workspace_id, "member");
  await ctx.tasks.hardDelete(id);
  await recordActivity({
    workspaceId: current.workspace_id,
    actorId: ctx.user.id,
    action: "deleted",
    entityType: "task",
    entityId: current.id,
    entityTitle: current.title,
    summary: `deleted ${current.title}`,
  });
  return { id };
}

export async function assignTask(taskId: string, userId: string) {
  const { ctx, task } = await requireTaskAccess(taskId, "member");
  const target = await ctx.members.getMembership(task.workspace_id, userId);
  if (!target) throw new InvalidAssigneeError();

  const assignees = new TaskAssigneeRepository(ctx.supabase);
  const row = await assignees.assign({
    task_id: taskId,
    user_id: userId,
    assigned_by: ctx.user.id,
    workspace_id: task.workspace_id,
  });

  await recordActivity({
    workspaceId: task.workspace_id,
    actorId: ctx.user.id,
    action: "assigned",
    entityType: "task",
    entityId: taskId,
    entityTitle: task.title,
    summary: `assigned ${task.title}`,
    metadata: { assigneeId: userId },
  });

  if (userId !== ctx.user.id) {
    await notifyUser({
      userId,
      workspaceId: task.workspace_id,
      type: "task_assigned",
      entityType: "task",
      entityId: taskId,
      title: "You were assigned a task",
      message: task.title,
      dedupeKey: `task_assigned:${taskId}:${userId}:${Date.now() - (Date.now() % 60_000)}`,
    });
  }

  return row;
}

export async function unassignTask(taskId: string, userId: string) {
  const { ctx, task } = await requireTaskAccess(taskId, "member");
  const assignees = new TaskAssigneeRepository(ctx.supabase);
  await assignees.unassign(taskId, userId);

  await recordActivity({
    workspaceId: task.workspace_id,
    actorId: ctx.user.id,
    action: "unassigned",
    entityType: "task",
    entityId: taskId,
    entityTitle: task.title,
    summary: `unassigned ${task.title}`,
    metadata: { assigneeId: userId },
  });

  return { taskId, userId };
}

export async function listTaskAssignees(taskId: string) {
  const { ctx, task } = await requireTaskAccess(taskId, "viewer");
  const assignees = new TaskAssigneeRepository(ctx.supabase);
  return assignees.listByTask(task.id);
}

void MemberNotFoundError;
