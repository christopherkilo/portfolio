import { httpResource } from "@angular/common/http";
import { Injectable, computed, inject } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import { mapTask } from "../api/mappers";
import type { Task, TaskRow } from "../api/models";
import { WorkspaceContextService } from "./workspace-context";

@Injectable({ providedIn: "root" })
export class TasksDataService {
  private readonly workspace = inject(WorkspaceContextService);

  readonly resource = httpResource(
    () => {
      const workspaceId = this.workspace.currentWorkspaceId();
      return workspaceId
        ? `/api/tasks?workspaceId=${encodeURIComponent(workspaceId)}`
        : undefined;
    },
    {
      defaultValue: [] as TaskRow[],
      parse: (raw) => parseTaskflowEnvelope<TaskRow[]>(raw),
    },
  );

  readonly tasks = computed<Task[]>(() => this.resource.value().map(mapTask));
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());
  readonly hasValue = computed(() => this.resource.hasValue());

  reload(): void {
    this.resource.reload();
  }
}
