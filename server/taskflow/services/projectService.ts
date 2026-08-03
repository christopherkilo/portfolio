import "server-only";

import {
  createTaskflowContext,
  requireWorkspaceMember,
} from "@/server/taskflow/auth/authorization";
import {
  InternalError,
  InvalidPatchError,
  StaleVersionError,
} from "@/server/taskflow/errors";
import type { UpdateProjectInput } from "@/server/taskflow/schemas";
import { recordActivity } from "@/server/taskflow/services/activityService";
import type { ProjectRow } from "@/server/taskflow/types/database";

export async function listProjects(workspaceId: string) {
  const { ctx } = await requireWorkspaceMember(workspaceId, "viewer");
  return ctx.projects.listByWorkspace(workspaceId);
}

export async function createProject(
  input: import("@/server/taskflow/schemas").CreateProjectInput,
) {
  const { ctx } = await requireWorkspaceMember(input.workspaceId, "admin");
  const project = await ctx.projects.create({
    workspace_id: input.workspaceId,
    name: input.name,
    description: input.description ?? "",
    status: input.status ?? "planning",
    color: input.color ?? "#60A5FA",
    due_date: input.dueDate ?? null,
    created_by: ctx.user.id,
  });
  await recordActivity({
    workspaceId: input.workspaceId,
    actorId: ctx.user.id,
    action: "created",
    entityType: "project",
    entityId: project.id,
    entityTitle: project.name,
    summary: `created project ${project.name}`,
  });
  return project;
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const boot = await createTaskflowContext();
  const current = await boot.projects.require(id);
  const { ctx } = await requireWorkspaceMember(current.workspace_id, "admin");

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.color !== undefined) patch.color = input.color;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate;
  if (input.archived !== undefined) patch.archived = input.archived;

  if (Object.keys(patch).length === 0) {
    throw new InvalidPatchError("Submit at least one field to update.");
  }

  const { data: updated, error } = await ctx.supabase.rpc(
    "update_project_versioned",
    {
      p_project_id: id,
      p_expected_version: input.expectedVersion,
      p_patch: patch,
    },
  );

  if (error || !updated) {
    const msg = error?.message ?? "";
    if (msg.includes("STALE_VERSION")) {
      throw new StaleVersionError(await ctx.projects.getById(id));
    }
    if (msg.includes("EMPTY_PATCH") || msg.includes("INVALID_PATCH")) {
      throw new InvalidPatchError();
    }
    throw new InternalError("Could not update project.");
  }

  // Audit is written atomically inside update_project_versioned when changes occur.
  return updated as ProjectRow;
}
