import "server-only";

import type { TaskflowSupabase } from "@/server/taskflow/supabase/server";
import type {
  ProfileRow,
  WorkspaceMemberRow,
  WorkspaceRole,
} from "@/server/taskflow/types/database";
import { ConflictError, InternalError, NotFoundError } from "@/server/taskflow/errors";

function throwDb(error: { message?: string; code?: string } | null, fallback: string): never {
  if (error?.code === "23505") throw new ConflictError("That membership already exists.");
  throw new InternalError(fallback);
}

export class MemberRepository {
  constructor(private readonly supabase: TaskflowSupabase) {}

  async getMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMemberRow | null> {
    const { data, error } = await this.supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throwDb(error, "Could not load membership.");
    return data;
  }

  async listByWorkspace(workspaceId: string): Promise<WorkspaceMemberRow[]> {
    const { data, error } = await this.supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    if (error) throwDb(error, "Could not load members.");
    return data ?? [];
  }

  async listWithProfiles(workspaceId: string) {
    const members = await this.listByWorkspace(workspaceId);
    const ids = members.map((m) => m.user_id);
    if (!ids.length) return [] as Array<WorkspaceMemberRow & { profile?: ProfileRow }>;
    const { data: profiles, error } = await this.supabase
      .from("profiles")
      .select("*")
      .in("id", ids);
    if (error) throwDb(error, "Could not load member profiles.");
    const byId = new Map((profiles ?? []).map((p) => [p.id, p as ProfileRow]));
    return members.map((member) => ({
      ...member,
      profile: byId.get(member.user_id),
    }));
  }

  async addMember(input: {
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
  }): Promise<WorkspaceMemberRow> {
    const { data, error } = await this.supabase
      .from("workspace_members")
      .insert({
        workspace_id: input.workspaceId,
        user_id: input.userId,
        role: input.role,
      })
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not add workspace member.");
    return data;
  }

  async updateRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMemberRow> {
    const { data, error } = await this.supabase
      .from("workspace_members")
      .update({ role })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not update member role.");
    return data;
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const { error, count } = await this.supabase
      .from("workspace_members")
      .delete({ count: "exact" })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    if (error) throwDb(error, "Could not remove member.");
    if (!count) throw new NotFoundError("Member not found.");
  }
}
