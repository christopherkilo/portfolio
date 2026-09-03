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
import { MembersDataService } from "./members-data";
import { assertOnlineForUnsafeAction } from "../offline/offline-unsafe";

@Injectable({ providedIn: "root" })
export class MemberMutationsService {
  private readonly http = inject(HttpClient);
  private readonly members = inject(MembersDataService);
  private readonly activity = inject(ActivityDataService);

  async updateRole(
    workspaceId: string,
    userId: string,
    role: Exclude<WorkspaceRole, "owner">,
  ): Promise<void> {
    assertOnlineForUnsafeAction("role_change");
    await firstValueFrom(
      this.http
        .patch<ApiSuccess<unknown> | ApiFailure>(
          `/api/taskflow/workspaces/${workspaceId}/members/${userId}`,
          { role },
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.members.reload();
    this.activity.reload();
  }

  async remove(workspaceId: string, userId: string): Promise<void> {
    assertOnlineForUnsafeAction("member_remove");
    await firstValueFrom(
      this.http
        .delete<ApiSuccess<unknown> | ApiFailure>(
          `/api/taskflow/workspaces/${workspaceId}/members/${userId}`,
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.members.reload();
    this.activity.reload();
  }
}
