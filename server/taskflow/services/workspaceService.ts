import "server-only";

import {
  createTaskflowContext,
  requireWorkspaceMember,
} from "@/server/taskflow/auth/authorization";
import type {
  CreateWorkspaceInput,
} from "@/server/taskflow/schemas";
import { requireTaskflowUser } from "@/server/taskflow/auth/session";

export async function listWorkspaces() {
  const ctx = await createTaskflowContext();
  return ctx.workspaces.listForUser(ctx.user.id);
}

export async function createWorkspace(input: CreateWorkspaceInput) {
  const ctx = await createTaskflowContext();
  const workspace = await ctx.workspaces.create({
    name: input.name,
    description: input.description ?? "",
    createdBy: ctx.user.id,
  });
  await ctx.members.addMember({
    workspaceId: workspace.id,
    userId: ctx.user.id,
    role: "owner",
  });
  const { recordActivity } = await import("@/server/taskflow/services/activityService");
  await recordActivity({
    workspaceId: workspace.id,
    actorId: ctx.user.id,
    action: "created",
    entityType: "workspace",
    entityId: workspace.id,
    entityTitle: workspace.name,
    summary: `created workspace ${workspace.name}`,
  });
  return workspace;
}

export async function renameWorkspace(workspaceId: string, name: string) {
  const { ctx } = await requireWorkspaceMember(workspaceId, "owner");
  const updated = await ctx.workspaces.rename(workspaceId, name);
  const { recordActivity } = await import("@/server/taskflow/services/activityService");
  await recordActivity({
    workspaceId,
    actorId: ctx.user.id,
    action: "renamed",
    entityType: "workspace",
    entityId: workspaceId,
    entityTitle: updated.name,
    summary: `renamed workspace to ${updated.name}`,
    newValue: updated.name,
  });
  return updated;
}

export async function ensureDefaultWorkspace() {
  const existing = await listWorkspaces();
  if (existing.length) return existing[0];
  return createWorkspace({
    name: "My Workspace",
    description: "Your personal TaskFlow workspace",
  });
}

export async function getCurrentUser() {
  return requireTaskflowUser();
}

/** @deprecated Prefer memberService.listMembers */
export async function listWorkspaceMembers(workspaceId: string) {
  const { listMembers } = await import("@/server/taskflow/services/memberService");
  return listMembers(workspaceId);
}
