import "server-only";

import type { TaskflowSupabase } from "@/server/taskflow/supabase/server";
import type { CommentRow } from "@/server/taskflow/types/database";
import { InternalError, NotFoundError } from "@/server/taskflow/errors";

function throwDb(error: { message?: string; code?: string } | null, fallback: string): never {
  throw new InternalError(fallback);
}

export class CommentRepository {
  constructor(private readonly supabase: TaskflowSupabase) {}

  async listByTask(taskId: string): Promise<CommentRow[]> {
    const { data, error } = await this.supabase
      .from("comments")
      .select("*")
      .eq("task_id", taskId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });
    if (error) throwDb(error, "Could not load comments.");
    return (data ?? []) as CommentRow[];
  }

  async getById(id: string): Promise<CommentRow | null> {
    const { data, error } = await this.supabase
      .from("comments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throwDb(error, "Could not load comment.");
    return data as CommentRow | null;
  }

  async require(id: string): Promise<CommentRow> {
    const row = await this.getById(id);
    if (!row || row.deleted_at) throw new NotFoundError("Comment not found.");
    return row;
  }

  async create(input: {
    workspace_id: string;
    task_id: string;
    author_id: string;
    body: string;
  }): Promise<CommentRow> {
    const { data, error } = await this.supabase
      .from("comments")
      .insert(input)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not create comment.");
    return data as CommentRow;
  }

  async updateBody(id: string, body: string): Promise<CommentRow> {
    const { data, error } = await this.supabase
      .from("comments")
      .update({ body })
      .eq("id", id)
      .is("deleted_at", null)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not update comment.");
    return data as CommentRow;
  }

  async softDelete(id: string): Promise<CommentRow> {
    const { data, error } = await this.supabase
      .from("comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not delete comment.");
    return data as CommentRow;
  }
}
