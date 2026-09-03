import { httpResource } from "@angular/common/http";
import { Injectable, computed, inject } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import type { PendingInvitation, WorkspaceInvitationRow } from "../api/models";
import { WorkspaceContextService } from "./workspace-context";
import { WorkspacePermissionsService } from "./permissions";

function withoutTokenHash(row: WorkspaceInvitationRow): WorkspaceInvitationRow {
  const { token_hash: _removed, ...rest } = row;
  void _removed;
  return rest;
}

function stripTokenHash(row: WorkspaceInvitationRow): PendingInvitation {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    email: row.email,
    role: row.role,
    expires_at: row.expires_at,
    created_at: row.created_at,
  };
}

/**
 * Pending invitations. Skips the GET unless the current user can invite
 * (admin+). Viewers/members must not trigger a 403 loop.
 */
@Injectable({ providedIn: "root" })
export class InvitationsDataService {
  private readonly workspace = inject(WorkspaceContextService);
  private readonly permissions = inject(WorkspacePermissionsService);

  readonly resource = httpResource<WorkspaceInvitationRow[]>(
    () => {
      const workspaceId = this.workspace.currentWorkspaceId();
      if (!workspaceId || !this.permissions.canInviteMembers()) return undefined;
      return `/api/taskflow/workspaces/${encodeURIComponent(workspaceId)}/invitations`;
    },
    {
      defaultValue: [],
      parse: (raw) => parseTaskflowEnvelope<WorkspaceInvitationRow[]>(raw).map(withoutTokenHash),
    },
  );

  readonly invitations = computed<PendingInvitation[]>(() =>
    this.resource.value().map(stripTokenHash),
  );
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());
  readonly hasValue = computed(() => this.resource.hasValue());

  reload(): void {
    this.resource.reload();
  }
}
