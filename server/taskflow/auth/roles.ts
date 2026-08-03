import type { WorkspaceRole } from "@/server/taskflow/types/database";
import { ForbiddenError } from "@/server/taskflow/errors";

const rank: Record<WorkspaceRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export function roleAtLeast(role: WorkspaceRole, minimum: WorkspaceRole) {
  return rank[role] >= rank[minimum];
}

export function assertRole(
  role: WorkspaceRole | null | undefined,
  minimum: WorkspaceRole,
  message?: string,
) {
  if (!role || !roleAtLeast(role, minimum)) {
    throw new ForbiddenError(message);
  }
}
