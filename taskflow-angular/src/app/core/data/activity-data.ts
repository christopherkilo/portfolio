import { httpResource } from "@angular/common/http";
import { Injectable, computed, inject } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import { mapActivity } from "../api/mappers";
import type { ActivityEventRow, ActivityItem } from "../api/models";
import { WorkspaceContextService } from "./workspace-context";

@Injectable({ providedIn: "root" })
export class ActivityDataService {
  private readonly workspace = inject(WorkspaceContextService);

  readonly resource = httpResource(
    () => {
      const workspaceId = this.workspace.currentWorkspaceId();
      return workspaceId
        ? `/api/activity?workspaceId=${encodeURIComponent(workspaceId)}`
        : undefined;
    },
    {
      defaultValue: [] as ActivityEventRow[],
      parse: (raw) => parseTaskflowEnvelope<ActivityEventRow[]>(raw),
    },
  );

  readonly activity = computed<ActivityItem[]>(() =>
    this.resource.value().map(mapActivity),
  );
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());
  readonly hasValue = computed(() => this.resource.hasValue());

  reload(): void {
    this.resource.reload();
  }
}
