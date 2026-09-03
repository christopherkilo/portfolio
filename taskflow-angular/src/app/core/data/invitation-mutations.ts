import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  unwrapTaskflowEnvelope,
} from "../api/envelope";
import { catchTaskflowHttp } from "../api/http-rx";
import type { WorkspaceRole } from "../api/models";
import { ActivityDataService } from "./activity-data";
import { InvitationsDataService } from "./invitations-data";
import { MembersDataService } from "./members-data";
import { WorkspaceContextService } from "./workspace-context";
import { assertOnlineForUnsafeAction } from "../offline/offline-unsafe";

export type CreateInvitationResult = {
  invitation: {
    id: string;
    workspace_id: string;
    email: string;
    role: Exclude<WorkspaceRole, "owner">;
    expires_at: string;
    created_at: string;
  };
  acceptUrl?: string;
};

export type AcceptInvitationResult = {
  invitation_id: string;
  workspace_id: string;
  role: WorkspaceRole;
};

@Injectable({ providedIn: "root" })
export class InvitationMutationsService {
  private readonly http = inject(HttpClient);
  private readonly invitations = inject(InvitationsDataService);
  private readonly members = inject(MembersDataService);
  private readonly activity = inject(ActivityDataService);
  private readonly workspace = inject(WorkspaceContextService);

  async invite(
    workspaceId: string,
    input: { email: string; role: Exclude<WorkspaceRole, "owner"> },
  ): Promise<CreateInvitationResult> {
    assertOnlineForUnsafeAction("invitation_create");
    const result = await firstValueFrom(
      this.http
        .post<ApiSuccess<CreateInvitationResult> | ApiFailure>(
          `/api/taskflow/workspaces/${workspaceId}/invitations`,
          input,
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 201)),
          catchTaskflowHttp(),
        ),
    );
    this.invitations.reload();
    this.activity.reload();
    return result;
  }

  async revoke(workspaceId: string, invitationId: string): Promise<void> {
    assertOnlineForUnsafeAction("invitation_revoke");
    await firstValueFrom(
      this.http
        .delete<ApiSuccess<unknown> | ApiFailure>(
          `/api/taskflow/workspaces/${workspaceId}/invitations/${invitationId}`,
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.invitations.reload();
    this.activity.reload();
  }

  async accept(token: string): Promise<AcceptInvitationResult> {
    assertOnlineForUnsafeAction("invitation_accept");
    const result = await firstValueFrom(
      this.http
        .post<ApiSuccess<AcceptInvitationResult> | ApiFailure>(
          "/api/taskflow/invitations/accept",
          { token },
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.workspace.reload();
    this.members.reload();
    this.invitations.reload();
    this.activity.reload();
    return result;
  }
}
