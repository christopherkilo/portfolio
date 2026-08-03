import "server-only";

import {
  assertCanChangeMemberRole,
  assertCanRemoveMember,
  requireWorkspaceMember,
} from "@/server/taskflow/auth/authorization";
import {
  InvalidRoleChangeError,
  MemberNotFoundError,
} from "@/server/taskflow/errors";
import type { UpdateMemberRoleInput } from "@/server/taskflow/schemas";
import { recordActivity } from "@/server/taskflow/services/activityService";
import { notifyUser } from "@/server/taskflow/services/notificationService";

export async function listMembers(workspaceId: string) {
  const { ctx } = await requireWorkspaceMember(workspaceId, "viewer");
  return ctx.members.listWithProfiles(workspaceId);
}

export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  input: UpdateMemberRoleInput,
) {
  const { ctx, membership: actor } = await requireWorkspaceMember(
    workspaceId,
    "admin",
  );
  const target = await ctx.members.getMembership(workspaceId, userId);
  if (!target) throw new MemberNotFoundError();

  try {
    assertCanChangeMemberRole({
      actorRole: actor.role,
      targetRole: target.role,
      nextRole: input.role,
    });
  } catch (error) {
    throw new InvalidRoleChangeError(
      error instanceof Error ? error.message : undefined,
    );
  }

  const updated = await ctx.members.updateRole(workspaceId, userId, input.role);

  await recordActivity({
    workspaceId,
    actorId: ctx.user.id,
    action: "role_changed",
    entityType: "member",
    entityId: userId,
    entityTitle: target.user_id,
    oldValue: target.role,
    newValue: input.role,
    summary: `changed role from ${target.role} to ${input.role}`,
    metadata: { userId, from: target.role, to: input.role },
  });

  if (userId !== ctx.user.id) {
    await notifyUser({
      userId,
      workspaceId,
      type: "role_changed",
      entityType: "member",
      entityId: userId,
      actorId: ctx.user.id,
      title: "Your role was updated",
      message: `You are now a ${input.role}.`,
      dedupeKey: `role_changed:${workspaceId}:${userId}:${input.role}`,
    });
  }

  return updated;
}

export async function removeMember(workspaceId: string, userId: string) {
  const { ctx, membership: actor } = await requireWorkspaceMember(
    workspaceId,
    "admin",
  );
  const target = await ctx.members.getMembership(workspaceId, userId);
  if (!target) throw new MemberNotFoundError();

  assertCanRemoveMember({
    actorRole: actor.role,
    targetRole: target.role,
    actorId: ctx.user.id,
    targetId: userId,
  });

  await ctx.members.removeMember(workspaceId, userId);

  await recordActivity({
    workspaceId,
    actorId: ctx.user.id,
    action: "removed",
    entityType: "member",
    entityId: userId,
    summary: `removed a member`,
    metadata: { userId, role: target.role },
  });

  return { workspaceId, userId };
}
