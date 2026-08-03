import "server-only";

import {
  createTaskflowContext,
  requireWorkspaceMember,
} from "@/server/taskflow/auth/authorization";
import type { ActivityEventRow } from "@/server/taskflow/types/database";

export type ActivityInput = {
  workspaceId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityTitle?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  changes?: Record<string, unknown>;
  requestId?: string | null;
  source?: string;
};

export async function recordActivity(
  input: ActivityInput,
): Promise<ActivityEventRow> {
  const ctx = await createTaskflowContext();
  return ctx.activity.create({
    workspace_id: input.workspaceId,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    entity_title: input.entityTitle ?? null,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
    changes: input.changes ?? {},
    request_id: input.requestId ?? null,
    source: input.source ?? "api",
  });
}

export async function listActivity(workspaceId: string) {
  const { ctx } = await requireWorkspaceMember(workspaceId, "viewer");
  return ctx.activity.listByWorkspace(workspaceId);
}
