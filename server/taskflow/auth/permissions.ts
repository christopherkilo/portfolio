import type { WorkspaceRole } from "@/server/taskflow/types/database";
import {
  ForbiddenError,
  OwnerRemovalForbiddenError,
  RoleEscalationForbiddenError,
} from "@/server/taskflow/errors";
import { roleAtLeast } from "@/server/taskflow/auth/roles";

export function canManageMembers(role: WorkspaceRole) {
  return roleAtLeast(role, "admin");
}

export function canEditTask(role: WorkspaceRole) {
  return roleAtLeast(role, "member");
}

export function canComment(role: WorkspaceRole) {
  return roleAtLeast(role, "member");
}

export function canManageProjects(role: WorkspaceRole) {
  return roleAtLeast(role, "admin");
}

export function canInvite(role: WorkspaceRole) {
  return roleAtLeast(role, "admin");
}

/** Admins may not remove owners or change owner roles. */
export function assertCanChangeMemberRole(params: {
  actorRole: WorkspaceRole;
  targetRole: WorkspaceRole;
  nextRole: WorkspaceRole;
}) {
  if (params.targetRole === "owner") {
    throw new ForbiddenError("The workspace owner role cannot be changed.");
  }
  if (params.nextRole === "owner") {
    throw new RoleEscalationForbiddenError(
      "Ownership transfer is not supported yet.",
    );
  }
  if (params.actorRole === "admin" && params.targetRole === "admin") {
    throw new RoleEscalationForbiddenError(
      "Admins cannot change other admins.",
    );
  }
  if (params.actorRole === "admin" && params.nextRole === "admin") {
    throw new RoleEscalationForbiddenError(
      "Admins cannot promote members to admin.",
    );
  }
  if (!roleAtLeast(params.actorRole, "admin")) {
    throw new ForbiddenError("You cannot manage member roles.");
  }
}

export function assertCanRemoveMember(params: {
  actorRole: WorkspaceRole;
  targetRole: WorkspaceRole;
  actorId: string;
  targetId: string;
}) {
  if (params.targetId === params.actorId) {
    throw new ForbiddenError("You cannot remove yourself from the workspace.");
  }
  if (params.targetRole === "owner") {
    throw new OwnerRemovalForbiddenError();
  }
  if (params.actorRole === "admin" && roleAtLeast(params.targetRole, "admin")) {
    throw new ForbiddenError("Admins cannot remove other admins.");
  }
  if (!roleAtLeast(params.actorRole, "admin")) {
    throw new ForbiddenError("You cannot remove members.");
  }
}
