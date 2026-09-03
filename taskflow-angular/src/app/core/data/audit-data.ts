import { httpResource } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import type { ActivityEventRow } from "../api/models";
import { WorkspaceContextService } from "./workspace-context";

@Injectable({ providedIn: "root" })
export class AuditDataService {
  private readonly workspace = inject(WorkspaceContextService);

  readonly entityType = signal("");
  readonly action = signal("");

  readonly resource = httpResource(
    () => {
      const workspaceId = this.workspace.currentWorkspaceId();
      if (!workspaceId) return undefined;
      const params = new URLSearchParams();
      const entityType = this.entityType().trim();
      const action = this.action().trim();
      if (entityType) params.set("entityType", entityType);
      if (action) params.set("action", action);
      const qs = params.toString();
      return `/api/taskflow/workspaces/${encodeURIComponent(workspaceId)}/audit${qs ? `?${qs}` : ""}`;
    },
    {
      defaultValue: [] as ActivityEventRow[],
      parse: (raw) => parseTaskflowEnvelope<ActivityEventRow[]>(raw),
    },
  );

  readonly events = computed(() => this.resource.value());
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());
  readonly hasValue = computed(() => this.resource.hasValue());

  setFilters(next: { entityType?: string; action?: string }): void {
    if (next.entityType !== undefined) this.entityType.set(next.entityType);
    if (next.action !== undefined) this.action.set(next.action);
  }

  reload(): void {
    this.resource.reload();
  }
}
