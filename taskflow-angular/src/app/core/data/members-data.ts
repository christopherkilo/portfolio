import { httpResource } from "@angular/common/http";
import { Injectable, computed, inject } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import { mapMember } from "../api/mappers";
import type { TeamMember, WorkspaceMemberRow } from "../api/models";
import { WorkspaceContextService } from "./workspace-context";

@Injectable({ providedIn: "root" })
export class MembersDataService {
  private readonly workspace = inject(WorkspaceContextService);

  readonly resource = httpResource(
    () => {
      const workspaceId = this.workspace.currentWorkspaceId();
      return workspaceId
        ? `/api/members?workspaceId=${encodeURIComponent(workspaceId)}`
        : undefined;
    },
    {
      defaultValue: [] as WorkspaceMemberRow[],
      parse: (raw) => parseTaskflowEnvelope<WorkspaceMemberRow[]>(raw),
    },
  );

  readonly members = computed<TeamMember[]>(() =>
    this.resource.value().map(mapMember),
  );
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());
  readonly hasValue = computed(() => this.resource.hasValue());

  reload(): void {
    this.resource.reload();
  }
}
