import "server-only";

import type { TaskflowSupabase } from "@/server/taskflow/supabase/server";
import type {
  ActivityEventRow,
  ProjectRow,
  TaskRow,
  WorkspaceMemberRow,
  WorkspaceRole,
  WorkspaceRow,
} from "@/server/taskflow/types/database";
import { InternalError, NotFoundError, SchemaNotReadyError } from "@/server/taskflow/errors";

function throwDb(
  error: { message?: string; code?: string } | null,
  fallback: string,
): never {
  const message = error?.message ?? "";
  console.error("[taskflow-db]", {
    fallback,
    code: error?.code,
    message: message.slice(0, 300),
  });
  if (
    /schema cache|does not exist|Could not find the table/i.test(message) ||
    error?.code === "PGRST205" ||
    error?.code === "42P01"
  ) {
    throw new SchemaNotReadyError();
  }
  throw new InternalError(fallback);
}

export class WorkspaceRepository {
  constructor(private readonly supabase: TaskflowSupabase) {}

  async listForUser(userId: string): Promise<WorkspaceRow[]> {
    const { data: memberships, error: memberError } = await this.supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId);
    if (memberError) throwDb(memberError, "Could not load workspaces.");
    const ids = (memberships ?? []).map((row) => row.workspace_id);
    if (!ids.length) return [];
    const { data, error } = await this.supabase
      .from("workspaces")
      .select("*")
      .in("id", ids)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    if (error) throwDb(error, "Could not load workspaces.");
    return data ?? [];
  }

  async getById(id: string): Promise<WorkspaceRow | null> {
    const { data, error } = await this.supabase
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throwDb(error, "Could not load workspace.");
    return data;
  }

  async create(input: {
    name: string;
    description: string;
    createdBy: string;
  }): Promise<WorkspaceRow> {
    const { data, error } = await this.supabase
      .from("workspaces")
      .insert({
        name: input.name,
        description: input.description,
        created_by: input.createdBy,
      })
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not create workspace.");
    return data;
  }

  async rename(id: string, name: string): Promise<WorkspaceRow> {
    const { data, error } = await this.supabase
      .from("workspaces")
      .update({ name })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not rename workspace.");
    return data;
  }

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

  async listMembers(workspaceId: string): Promise<WorkspaceMemberRow[]> {
    const { data, error } = await this.supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId);
    if (error) throwDb(error, "Could not load members.");
    return data ?? [];
  }

  async require(id: string): Promise<WorkspaceRow> {
    const row = await this.getById(id);
    if (!row || row.archived_at) throw new NotFoundError("Workspace not found.");
    return row;
  }
}

export class ProjectRepository {
  constructor(private readonly supabase: TaskflowSupabase) {}

  async listByWorkspace(workspaceId: string): Promise<ProjectRow[]> {
    const { data, error } = await this.supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    if (error) throwDb(error, "Could not load projects.");
    return data ?? [];
  }

  async getById(id: string): Promise<ProjectRow | null> {
    const { data, error } = await this.supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throwDb(error, "Could not load project.");
    return data;
  }

  async require(id: string): Promise<ProjectRow> {
    const row = await this.getById(id);
    if (!row || row.archived_at) throw new NotFoundError("Project not found.");
    return row;
  }

  async create(
    input: ProjectRow extends never
      ? never
      : {
          workspace_id: string;
          name: string;
          description: string;
          status: ProjectRow["status"];
          color: string;
          due_date: string | null;
          created_by: string;
        },
  ): Promise<ProjectRow> {
    const { data, error } = await this.supabase
      .from("projects")
      .insert(input)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not create project.");
    return data;
  }

  async update(
    id: string,
    patch: Partial<{
      name: string;
      description: string;
      status: ProjectRow["status"];
      color: string;
      due_date: string | null;
      archived_at: string | null;
    }>,
  ): Promise<ProjectRow> {
    const { data, error } = await this.supabase
      .from("projects")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not update project.");
    return data;
  }
}

export class TaskRepository {
  constructor(private readonly supabase: TaskflowSupabase) {}

  async listByWorkspace(
    workspaceId: string,
    projectId?: string,
  ): Promise<TaskRow[]> {
    let query = this.supabase
      .from("tasks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    if (projectId) query = query.eq("project_id", projectId);
    const { data, error } = await query;
    if (error) throwDb(error, "Could not load tasks.");
    return data ?? [];
  }

  async getById(id: string): Promise<TaskRow | null> {
    const { data, error } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throwDb(error, "Could not load task.");
    return data;
  }

  async require(id: string): Promise<TaskRow> {
    const row = await this.getById(id);
    if (!row || row.archived_at) throw new NotFoundError("Task not found.");
    return row;
  }

  async create(input: {
    workspace_id: string;
    project_id: string;
    title: string;
    description: string;
    status: TaskRow["status"];
    priority: TaskRow["priority"];
    assignee_id: string | null;
    due_date: string | null;
    labels: string[];
    estimate: number | null;
    created_by: string;
  }): Promise<TaskRow> {
    const { data, error } = await this.supabase
      .from("tasks")
      .insert(input)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not create task.");
    return data;
  }

  async update(
    id: string,
    patch: Partial<{
      title: string;
      description: string;
      status: TaskRow["status"];
      priority: TaskRow["priority"];
      project_id: string;
      assignee_id: string | null;
      due_date: string | null;
      labels: string[];
      estimate: number | null;
      archived_at: string | null;
    }>,
  ): Promise<TaskRow> {
    const { data, error } = await this.supabase
      .from("tasks")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not update task.");
    return data;
  }

  async softDelete(id: string): Promise<TaskRow> {
    return this.update(id, { archived_at: new Date().toISOString() });
  }

  async hardDelete(id: string): Promise<void> {
    const { error } = await this.supabase.from("tasks").delete().eq("id", id);
    if (error) throwDb(error, "Could not delete task.");
  }
}

export class ActivityRepository {
  constructor(private readonly supabase: TaskflowSupabase) {}

  async listByWorkspace(
    workspaceId: string,
    limit = 50,
  ): Promise<ActivityEventRow[]> {
    const { data, error } = await this.supabase
      .from("activity_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throwDb(error, "Could not load activity.");
    return data ?? [];
  }

  async create(input: {
    workspace_id: string;
    actor_id: string | null;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    entity_title?: string | null;
    old_value?: string | null;
    new_value?: string | null;
    summary: string;
    metadata?: Record<string, unknown>;
    changes?: Record<string, unknown>;
    request_id?: string | null;
    source?: string;
  }): Promise<ActivityEventRow> {
    const { data, error } = await this.supabase
      .from("activity_events")
      .insert({
        workspace_id: input.workspace_id,
        actor_id: input.actor_id,
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id ?? null,
        entity_title: input.entity_title ?? null,
        old_value: input.old_value ?? null,
        new_value: input.new_value ?? null,
        summary: input.summary,
        metadata: input.metadata ?? {},
        changes: input.changes ?? {},
        request_id: input.request_id ?? null,
        source: input.source ?? "api",
      })
      .select("*")
      .single();
    if (error || !data) throwDb(error, "Could not record activity.");
    return data;
  }
}
