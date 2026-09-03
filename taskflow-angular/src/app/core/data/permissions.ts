import { Injectable, computed, inject } from "@angular/core";
import { AuthService } from "../auth/auth";
import { roleAtLeast } from "../auth/roles";
import type { TeamMember, WorkspaceRole } from "../api/models";
import { WorkspaceReadsService } from "./workspace-reads";

export const INVITE_ROLES: Exclude<WorkspaceRole, "owner">[] = [
  "admin",
  "member",
  "viewer",
];

export const ROLE_CHANGE_OPTIONS: Exclude<WorkspaceRole, "owner">[] = [
  "admin",
  "member",
  "viewer",
];

/**
 * UX capabilities from existing membership + auth.
 * Not a new ACL. Backend authorization remains authoritative.
 */
@Injectable({ providedIn: "root" })
export class WorkspacePermissionsService {
  private readonly auth = inject(AuthService);
  private readonly reads = inject(WorkspaceReadsService);

  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);

  readonly currentRole = computed<WorkspaceRole>(() => {
    const userId = this.currentUserId();
    if (!userId) return "viewer";
    return (
      this.reads.members.members().find((member) => member.id === userId)?.role ??
      "viewer"
    );
  });

  readonly canEditTask = computed(() => roleAtLeast(this.currentRole(), "member"));
  readonly canComment = computed(() => this.canEditTask());
  readonly canUploadAttachment = computed(() => this.canEditTask());
  readonly canDeleteAttachment = computed(() => this.canEditTask());
  readonly canManageProjects = computed(() =>
    roleAtLeast(this.currentRole(), "admin"),
  );
  readonly canManageMembers = computed(() =>
    roleAtLeast(this.currentRole(), "admin"),
  );
  readonly canInviteMembers = computed(() =>
    roleAtLeast(this.currentRole(), "admin"),
  );
  readonly canViewAudit = computed(() => roleAtLeast(this.currentRole(), "admin"));

  canManageComment(authorId: string): boolean {
    const userId = this.currentUserId();
    if (!userId) return false;
    if (authorId === userId) return true;
    return roleAtLeast(this.currentRole(), "admin");
  }

  canChangeMemberRole(target: TeamMember): boolean {
    const actorRole = this.currentRole();
    if (!roleAtLeast(actorRole, "admin")) return false;
    if (target.role === "owner") return false;
    if (actorRole === "admin" && target.role === "admin") return false;
    return true;
  }

  canRemoveMember(target: TeamMember): boolean {
    const actorId = this.currentUserId();
    const actorRole = this.currentRole();
    if (!actorId || !roleAtLeast(actorRole, "admin")) return false;
    if (actorId === target.id) return false;
    if (target.role === "owner") return false;
    if (actorRole === "admin" && roleAtLeast(target.role, "admin")) return false;
    return true;
  }

  roleSelectOptions(): Exclude<WorkspaceRole, "owner">[] {
    if (this.currentRole() === "owner") return [...ROLE_CHANGE_OPTIONS];
    return ROLE_CHANGE_OPTIONS.filter((role) => role !== "admin");
  }

  inviteRoleOptions(): Exclude<WorkspaceRole, "owner">[] {
    return [...INVITE_ROLES];
  }
}
