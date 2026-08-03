import "server-only";

import type { TaskflowSupabase } from "@/server/taskflow/supabase/server";
import type { TaskAssigneeRow } from "@/server/taskflow/types/database";
import {
  DuplicateAssignmentError,
  InternalError,
  InvalidAssigneeError,
  NotFoundError,
} from "@/server/taskflow/errors";

function throwDb(error: { message?: string; code?: string } | null, fallback: string): never {
  const msg = error?.message ?? "";
  if (error?.code === "23505") throw new DuplicateAssignmentError();
  if (msg.includes("ASSIGNEE_NOT_MEMBER")) throw new InvalidAssigneeError();
  throw new InternalError(fallback);
}

export class TaskAssigneeRepository {
  constructor(private readonly supabase: TaskflowSupabase) {}

  async listByTask(taskId: string): Promise<TaskAssigneeRow[]> {
    const { data, error } = await this.supabase
      .from("task_assignees")
      .select("*")
      .eq("task_id", taskId)
      .order("assigned_at", { ascending: true });
    if (error) throwDb(error, "Could not load assignees.");
    return (data ?? []) as TaskAssigneeRow[];
  }

  async listByWorkspace(workspaceId: string): Promise<TaskAssigneeRow[]> {
    const { data, error } = await this.supabase
      .from("task_assignees")
      .select("*")
      .eq("workspace_id", workspaceId);
    if (error) throwDb(error, "Could not load assignees.");
    return (data ?? []) as TaskAssigneeRow[];
  }

  async assign(input: {
    task_id: string;
    user_id: string;
    assigned_by: string;
    workspace_id: string;
  }): Promise<TaskAssigneeRow> {
    const { data, error } = await this.supabase
      .from("task_assignees")
      .insert({
        task_id: input.task_id,
        user_id: input.user_id,
        assigned_by: input.assigned_by,
        workspace_id: input.workspace_id,
      })
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not assign member.");
    return data as TaskAssigneeRow;
  }

  async unassign(taskId: string, userId: string): Promise<void> {
    const { error, count } = await this.supabase
      .from("task_assignees")
      .delete({ count: "exact" })
      .eq("task_id", taskId)
      .eq("user_id", userId);
    if (error) throwDb(error, "Could not unassign member.");
    if (!count) throw new NotFoundError("Assignment not found.");
  }
}
