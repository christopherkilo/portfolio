import "server-only";

import {
  requireTaskAccess,
  requireWorkspaceMember,
} from "@/server/taskflow/auth/authorization";
import { AuditAccessDeniedError } from "@/server/taskflow/errors";
import { roleAtLeast } from "@/server/taskflow/auth/roles";

export async function getTaskHistory(taskId: string) {
  const { ctx, task } = await requireTaskAccess(taskId, "viewer");
  const events = await ctx.activity.listByWorkspace(task.workspace_id, 100);
  return events.filter(
    (event) => event.entity_type === "task" && event.entity_id === taskId,
  );
}

export async function getWorkspaceAudit(
  workspaceId: string,
  filters?: {
    actorId?: string;
    entityType?: string;
    action?: string;
  },
) {
  const { membership } = await requireWorkspaceMember(workspaceId, "viewer");
  if (!roleAtLeast(membership.role, "admin")) {
    throw new AuditAccessDeniedError();
  }

  const { ctx } = await requireWorkspaceMember(workspaceId, "admin");
  let events = await ctx.activity.listByWorkspace(workspaceId, 200);
  if (filters?.actorId) {
    events = events.filter((e) => e.actor_id === filters.actorId);
  }
  if (filters?.entityType) {
    events = events.filter((e) => e.entity_type === filters.entityType);
  }
  if (filters?.action) {
    events = events.filter((e) => e.action === filters.action);
  }
  return events;
}
