import type { WorkspaceRole } from "../api/models";

const rank: Record<WorkspaceRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

/** Same ranking as `server/taskflow/auth/roles.ts`. UX only — API still authorizes. */
export function roleAtLeast(role: WorkspaceRole, minimum: WorkspaceRole): boolean {
  return rank[role] >= rank[minimum];
}
