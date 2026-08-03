import "server-only";

import {
  createTaskflowContext,
  requireTaskAccess,
} from "@/server/taskflow/auth/authorization";
import {
  CommentNotFoundError,
  CommentPermissionDeniedError,
} from "@/server/taskflow/errors";
import { roleAtLeast } from "@/server/taskflow/auth/roles";
import type {
  CreateCommentInput,
  UpdateCommentInput,
} from "@/server/taskflow/schemas";
import { recordActivity } from "@/server/taskflow/services/activityService";
import { notifyUser } from "@/server/taskflow/services/notificationService";
import { TaskAssigneeRepository } from "@/server/taskflow/repositories/taskAssigneeRepository";

export async function listComments(taskId: string) {
  const { ctx } = await requireTaskAccess(taskId, "viewer");
  const comments = await ctx.comments.listByTask(taskId);
  const authorIds = [...new Set(comments.map((c) => c.author_id))];
  if (!authorIds.length) return comments.map((c) => ({ ...c, author: null }));
  const { data: profiles } = await ctx.supabase
    .from("profiles")
    .select("*")
    .in("id", authorIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return comments.map((c) => ({
    ...c,
    author: byId.get(c.author_id) ?? null,
  }));
}

export async function createComment(taskId: string, input: CreateCommentInput) {
  const { ctx, task } = await requireTaskAccess(taskId, "member");
  const comment = await ctx.comments.create({
    workspace_id: task.workspace_id,
    task_id: taskId,
    author_id: ctx.user.id,
    body: input.body,
  });

  await recordActivity({
    workspaceId: task.workspace_id,
    actorId: ctx.user.id,
    action: "commented",
    entityType: "task",
    entityId: taskId,
    entityTitle: task.title,
    summary: `commented on ${task.title}`,
    metadata: { commentId: comment.id },
  });

  const assignees = new TaskAssigneeRepository(ctx.supabase);
  const assigned = await assignees.listByTask(taskId);
  const notifyIds = new Set(assigned.map((a) => a.user_id));
  if (task.assignee_id) notifyIds.add(task.assignee_id);
  notifyIds.delete(ctx.user.id);

  await Promise.all(
    [...notifyIds].map((userId) =>
      notifyUser({
        userId,
        workspaceId: task.workspace_id,
        type: "comment_added",
        entityType: "task",
        entityId: taskId,
        actorId: ctx.user.id,
        title: "New comment",
        message: task.title,
        metadata: { commentId: comment.id },
        dedupeKey: `comment_added:${comment.id}:${userId}`,
        groupKey: `comments:${taskId}:${userId}`,
      }),
    ),
  );

  return comment;
}

export async function updateComment(commentId: string, input: UpdateCommentInput) {
  const boot = await createTaskflowContext();
  const current = await boot.comments.getById(commentId);
  if (!current || current.deleted_at) throw new CommentNotFoundError();

  const { ctx, membership } = await requireTaskAccess(current.task_id, "member");
  const isAuthor = current.author_id === ctx.user.id;
  const isModerator = roleAtLeast(membership.role, "admin");
  if (!isAuthor && !isModerator) throw new CommentPermissionDeniedError();

  return ctx.comments.updateBody(commentId, input.body);
}

export async function deleteComment(commentId: string) {
  const boot = await createTaskflowContext();
  const current = await boot.comments.getById(commentId);
  if (!current || current.deleted_at) throw new CommentNotFoundError();

  const { ctx, membership, task } = await requireTaskAccess(
    current.task_id,
    "member",
  );
  const isAuthor = current.author_id === ctx.user.id;
  const isModerator = roleAtLeast(membership.role, "admin");
  if (!isAuthor && !isModerator) throw new CommentPermissionDeniedError();

  const deleted = await ctx.comments.softDelete(commentId);
  await recordActivity({
    workspaceId: task.workspace_id,
    actorId: ctx.user.id,
    action: "comment_deleted",
    entityType: "task",
    entityId: task.id,
    entityTitle: task.title,
    summary: `removed a comment on ${task.title}`,
    metadata: { commentId },
  });
  return deleted;
}
