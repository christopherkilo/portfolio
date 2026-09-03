import { Component, computed, inject, signal } from "@angular/core";
import { userFacingLoadError } from "../../core/api/http-error";
import { userFacingMutationError } from "../../core/api/mutation-error";
import type { PendingInvitation, TeamMember, WorkspaceRole } from "../../core/api/models";
import { isBrowserOffline } from "../../core/data/connection";
import { formatRelativeTime } from "../../core/data/dates";
import { InvitationMutationsService } from "../../core/data/invitation-mutations";
import { InvitationsDataService } from "../../core/data/invitations-data";
import { MemberMutationsService } from "../../core/data/member-mutations";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import {
  describeActivity,
  findMember,
  memberWorkloadStats,
  recentActivity,
  type MemberWorkload,
} from "../../core/data/read-model";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { ProgressBar } from "../../shared/ui/progress-bar";
import { ReadDialog } from "../../shared/ui/read-dialog";
import {
  EmptyState,
  QueryError,
  QueryLoading,
} from "../../shared/ui/query-states";
import { InviteMemberForm } from "./invite-member-form";

@Component({
  selector: "tf-team-page",
  imports: [
    ProgressBar,
    ReadDialog,
    EmptyState,
    QueryError,
    QueryLoading,
    InviteMemberForm,
  ],
  templateUrl: "./team-page.html",
  styleUrl: "./team-page.scss",
})
export class TeamPage {
  readonly reads = inject(WorkspaceReadsService);
  readonly permissions = inject(WorkspacePermissionsService);
  readonly invitations = inject(InvitationsDataService);
  private readonly invitationMutations = inject(InvitationMutationsService);
  private readonly memberMutations = inject(MemberMutationsService);

  readonly formatRelativeTime = formatRelativeTime;
  readonly describeActivity = describeActivity;
  readonly findMember = findMember;

  readonly inviteOpen = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly rolePendingId = signal<string | null>(null);
  readonly revokePendingId = signal<string | null>(null);
  readonly removeTarget = signal<TeamMember | null>(null);
  readonly removing = signal(false);

  readonly loadError = computed(() => {
    const error = this.reads.error();
    return error ? userFacingLoadError(error) : null;
  });

  readonly rows = computed<MemberWorkload[]>(() =>
    this.reads.members
      .members()
      .map((member) => memberWorkloadStats(this.reads.tasks.tasks(), member)),
  );

  readonly feed = computed(() =>
    recentActivity(this.reads.activity.activity(), 12),
  );

  readonly workspaceId = computed(
    () => this.reads.workspace.currentWorkspaceId(),
  );

  readonly invitationError = computed(() => {
    const error = this.invitations.error();
    return error ? userFacingMutationError(error).message : null;
  });

  canChangeRole(member: TeamMember): boolean {
    return this.permissions.canChangeMemberRole(member);
  }

  canRemove(member: TeamMember): boolean {
    return this.permissions.canRemoveMember(member);
  }

  roleOptions(): Exclude<WorkspaceRole, "owner">[] {
    return this.permissions.roleSelectOptions();
  }

  openInvite(): void {
    if (isBrowserOffline()) {
      this.actionError.set("Invites require an active connection.");
      return;
    }
    this.actionError.set(null);
    this.inviteOpen.set(true);
  }

  closeInvite(): void {
    this.inviteOpen.set(false);
  }

  async onRoleChange(member: TeamMember, event: Event): Promise<void> {
    const workspaceId = this.workspaceId();
    const select = event.target as HTMLSelectElement;
    const next = select.value as Exclude<WorkspaceRole, "owner">;
    if (!workspaceId || next === member.role) return;
    if (isBrowserOffline()) {
      select.value = member.role;
      this.actionError.set("Role changes require an active connection.");
      return;
    }
    this.actionError.set(null);
    this.rolePendingId.set(member.id);
    try {
      await this.memberMutations.updateRole(workspaceId, member.id, next);
    } catch (error) {
      select.value = member.role;
      this.actionError.set(userFacingMutationError(error).message);
    } finally {
      this.rolePendingId.set(null);
    }
  }

  confirmRemove(member: TeamMember): void {
    if (isBrowserOffline()) {
      this.actionError.set("Member removal requires an active connection.");
      return;
    }
    this.actionError.set(null);
    this.removeTarget.set(member);
  }

  closeRemove(): void {
    if (this.removing()) return;
    this.removeTarget.set(null);
  }

  async removeMember(): Promise<void> {
    const workspaceId = this.workspaceId();
    const target = this.removeTarget();
    if (!workspaceId || !target || this.removing()) return;
    this.removing.set(true);
    this.actionError.set(null);
    try {
      await this.memberMutations.remove(workspaceId, target.id);
      this.removeTarget.set(null);
    } catch (error) {
      this.actionError.set(userFacingMutationError(error).message);
    } finally {
      this.removing.set(false);
    }
  }

  async revokeInvitation(invitation: PendingInvitation): Promise<void> {
    const workspaceId = this.workspaceId();
    if (!workspaceId || this.revokePendingId()) return;
    if (isBrowserOffline()) {
      this.actionError.set("Revoking invitations requires an active connection.");
      return;
    }
    this.actionError.set(null);
    this.revokePendingId.set(invitation.id);
    try {
      await this.invitationMutations.revoke(workspaceId, invitation.id);
    } catch (error) {
      this.actionError.set(userFacingMutationError(error).message);
    } finally {
      this.revokePendingId.set(null);
    }
  }
}
