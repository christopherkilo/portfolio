import "server-only";

import type { TaskflowSupabase } from "@/server/taskflow/supabase/server";
import type {
  NotificationRow,
  NotificationType,
} from "@/server/taskflow/types/database";
import {
  InternalError,
  NotificationCreationDeniedError,
  NotificationNotFoundError,
} from "@/server/taskflow/errors";

function throwDb(error: { message?: string; code?: string } | null, fallback: string): never {
  const msg = error?.message ?? "";
  if (msg.includes("FORBIDDEN") || msg.includes("UNAUTHORIZED") || msg.includes("RECIPIENT")) {
    throw new NotificationCreationDeniedError();
  }
  throw new InternalError(fallback);
}

export class NotificationRepository {
  constructor(private readonly supabase: TaskflowSupabase) {}

  async listForUser(userId: string, limit = 40): Promise<NotificationRow[]> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throwDb(error, "Could not load notifications.");
    return (data ?? []) as NotificationRow[];
  }

  async getById(id: string): Promise<NotificationRow | null> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throwDb(error, "Could not load notification.");
    return data as NotificationRow | null;
  }

  /** Controlled insert via SECURITY DEFINER RPC — actor derived from auth.uid(). */
  async createViaRpc(input: {
    user_id: string;
    workspace_id: string;
    type: NotificationType;
    entity_type: string;
    entity_id?: string | null;
    title: string;
    message?: string;
    metadata?: Record<string, unknown>;
    dedupe_key?: string | null;
    group_key?: string | null;
  }): Promise<NotificationRow | null> {
    const { data, error } = await this.supabase.rpc("create_or_group_notification", {
      p_user_id: input.user_id,
      p_workspace_id: input.workspace_id,
      p_type: input.type,
      p_entity_type: input.entity_type,
      p_entity_id: input.entity_id ?? null,
      p_title: input.title,
      p_message: input.message ?? "",
      p_metadata: input.metadata ?? {},
      p_group_key: input.group_key ?? null,
      p_dedupe_key: input.dedupe_key ?? null,
    });
    if (error) throwDb(error, "Could not create notification.");
    return (data as NotificationRow | null) ?? null;
  }

  async markRead(id: string, userId: string): Promise<NotificationRow> {
    const { data, error } = await this.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error || !data) {
      if (error) throwDb(error, "Could not mark notification as read.");
      throw new NotificationNotFoundError();
    }
    return data as NotificationRow;
  }

  async markAllRead(userId: string): Promise<number> {
    const { error, count } = await this.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() }, { count: "exact" })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throwDb(error, "Could not mark notifications as read.");
    return count ?? 0;
  }
}
