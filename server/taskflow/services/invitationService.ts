import "server-only";

import { createHash, randomBytes } from "node:crypto";
import {
  createTaskflowContext,
  requireWorkspaceMember,
} from "@/server/taskflow/auth/authorization";
import {
  ActiveInvitationExistsError,
  ConflictError,
  InvitationAlreadyPendingError,
  ValidationError,
} from "@/server/taskflow/errors";
import type {
  AcceptInvitationInput,
  CreateInvitationInput,
} from "@/server/taskflow/schemas";
import { getTaskflowServerEnv } from "@/server/taskflow/supabase/env";
import { recordActivity } from "@/server/taskflow/services/activityService";
import type { WorkspaceInvitationRow } from "@/server/taskflow/types/database";

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

function generateToken() {
  return randomBytes(32).toString("base64url");
}

export async function listInvitations(workspaceId: string) {
  const { ctx } = await requireWorkspaceMember(workspaceId, "admin");
  const rows = await ctx.invitations.listPending(workspaceId);
  const now = Date.now();
  return rows.filter((row) => new Date(row.expires_at).getTime() > now);
}

export async function createInvitation(
  workspaceId: string,
  input: CreateInvitationInput,
) {
  const { ctx } = await requireWorkspaceMember(workspaceId, "admin");
  const email = input.email.trim().toLowerCase();

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await ctx.supabase.rpc("create_workspace_invitation", {
    p_workspace_id: workspaceId,
    p_email: email,
    p_role: input.role,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  });

  if (error || !data) {
    const msg = error?.message ?? "";
    if (msg.includes("ACTIVE_INVITATION_EXISTS")) {
      throw new ActiveInvitationExistsError();
    }
    if (msg.includes("ALREADY_MEMBER")) {
      throw new ConflictError("That person is already a workspace member.");
    }
    throw error ?? new Error("Could not create invitation.");
  }

  const invitation = data as WorkspaceInvitationRow;

  await recordActivity({
    workspaceId,
    actorId: ctx.user.id,
    action: "invited",
    entityType: "invitation",
    entityId: invitation.id,
    entityTitle: email,
    summary: `invited ${email} as ${input.role}`,
    metadata: { email, role: input.role },
  });

  const { appUrl } = getTaskflowServerEnv();
  const acceptUrl = `${appUrl}/demos/taskflow/invite?token=${encodeURIComponent(rawToken)}`;
  const isDev = process.env.NODE_ENV !== "production";

  return {
    invitation: {
      id: invitation.id,
      workspace_id: invitation.workspace_id,
      email: invitation.email,
      role: invitation.role,
      expires_at: invitation.expires_at,
      created_at: invitation.created_at,
    },
    acceptUrl: isDev ? acceptUrl : undefined,
  };
}

export async function revokeInvitation(workspaceId: string, invitationId: string) {
  const { ctx } = await requireWorkspaceMember(workspaceId, "admin");
  const current = await ctx.invitations.require(invitationId);
  if (current.workspace_id !== workspaceId) {
    throw new ValidationError("Invitation does not belong to this workspace.");
  }
  if (current.accepted_at || current.revoked_at) {
    throw new ConflictError("Invitation is no longer active.");
  }
  return ctx.invitations.revoke(invitationId);
}

export async function acceptInvitation(input: AcceptInvitationInput) {
  const ctx = await createTaskflowContext();
  const tokenHash = hashToken(input.token);
  const result = await ctx.invitations.acceptByTokenHash(tokenHash);

  await recordActivity({
    workspaceId: result.workspace_id,
    actorId: ctx.user.id,
    action: "joined",
    entityType: "workspace",
    entityId: result.workspace_id,
    summary: `joined the workspace`,
    metadata: { invitationId: result.invitation_id, role: result.role },
  });

  return result;
}

export { hashToken as hashInvitationToken };
void InvitationAlreadyPendingError;
