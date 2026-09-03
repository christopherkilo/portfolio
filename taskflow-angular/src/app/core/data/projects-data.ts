import { httpResource } from "@angular/common/http";
import { Injectable, computed, inject } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import { mapProject } from "../api/mappers";
import type { Project, ProjectRow } from "../api/models";
import { WorkspaceContextService } from "./workspace-context";

@Injectable({ providedIn: "root" })
export class ProjectsDataService {
  private readonly workspace = inject(WorkspaceContextService);

  readonly resource = httpResource(
    () => {
      const workspaceId = this.workspace.currentWorkspaceId();
      return workspaceId
        ? `/api/projects?workspaceId=${encodeURIComponent(workspaceId)}`
        : undefined;
    },
    {
      defaultValue: [] as ProjectRow[],
      parse: (raw) => parseTaskflowEnvelope<ProjectRow[]>(raw),
    },
  );

  readonly projects = computed<Project[]>(() =>
    this.resource.value().map(mapProject),
  );
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());
  readonly hasValue = computed(() => this.resource.hasValue());

  reload(): void {
    this.resource.reload();
  }
}
