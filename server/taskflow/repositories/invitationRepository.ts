import "server-only";

import type { TaskflowSupabase } from "@/server/taskflow/supabase/server";
import type {
  WorkspaceInvitationRow,
  WorkspaceRole,
} from "@/server/taskflow/types/database";
import { ConflictError, InternalError, NotFoundError } from "@/server/taskflow/errors";

function throwDb(error: { message?: string; code?: string } | null, fallback: string): never {
  if (error?.code === "23505") {
    throw new ConflictError("An active invitation already exists for that email.");
  }
  throw new InternalError(fallback);
}

export class InvitationRepository {
  constructor(private readonly supabase: TaskflowSupabase) {}

  async listPending(workspaceId: string): Promise<WorkspaceInvitationRow[]> {
    const { data, error } = await this.supabase
      .from("workspace_invitations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    if (error) throwDb(error, "Could not load invitations.");
    return (data ?? []) as WorkspaceInvitationRow[];
  }

  async getById(id: string): Promise<WorkspaceInvitationRow | null> {
    const { data, error } = await this.supabase
      .from("workspace_invitations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throwDb(error, "Could not load invitation.");
    return data as WorkspaceInvitationRow | null;
  }

  async require(id: string): Promise<WorkspaceInvitationRow> {
    const row = await this.getById(id);
    if (!row) throw new NotFoundError("Invitation not found.");
    return row;
  }

  async create(input: {
    workspace_id: string;
    email: string;
    role: Exclude<WorkspaceRole, "owner">;
    token_hash: string;
    invited_by: string;
    expires_at: string;
  }): Promise<WorkspaceInvitationRow> {
    const { data, error } = await this.supabase
      .from("workspace_invitations")
      .insert(input)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not create invitation.");
    return data as WorkspaceInvitationRow;
  }

  async revoke(id: string): Promise<WorkspaceInvitationRow> {
    const { data, error } = await this.supabase
      .from("workspace_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not revoke invitation.");
    return data as WorkspaceInvitationRow;
  }

  /** Trusted RPC — see Phase 2 migration. */
  async acceptByTokenHash(tokenHash: string): Promise<{
    invitation_id: string;
    workspace_id: string;
    role: WorkspaceRole;
  }> {
    const { data, error } = await this.supabase.rpc(
      "accept_workspace_invitation",
      { p_token_hash: tokenHash },
    );
    if (error) {
      const msg = error.message ?? "";
      if (msg.includes("NOT_FOUND")) throw new NotFoundError("Invitation not found.");
      if (msg.includes("INVITATION_EXPIRED")) {
        const { InvitationExpiredError } = await import("@/server/taskflow/errors");
        throw new InvitationExpiredError();
      }
      if (msg.includes("INVITATION_ALREADY_ACCEPTED")) {
        const { InvitationAlreadyAcceptedError } = await import(
          "@/server/taskflow/errors"
        );
        throw new InvitationAlreadyAcceptedError();
      }
      if (msg.includes("INVITATION_REVOKED")) {
        const { InvitationExpiredError } = await import("@/server/taskflow/errors");
        throw new InvitationExpiredError("This invitation was revoked.");
      }
      if (msg.includes("INVITATION_EMAIL_MISMATCH")) {
        const { ForbiddenError } = await import("@/server/taskflow/errors");
        throw new ForbiddenError(
          "Sign in with the email address this invitation was sent to.",
        );
      }
      if (msg.includes("UNAUTHORIZED")) {
        const { UnauthorizedError } = await import("@/server/taskflow/errors");
        throw new UnauthorizedError();
      }
      throwDb(error, "Could not accept invitation.");
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new NotFoundError("Invitation not found.");
    return row as {
      invitation_id: string;
      workspace_id: string;
      role: WorkspaceRole;
    };
  }
}
