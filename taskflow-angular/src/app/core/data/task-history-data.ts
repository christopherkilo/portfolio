import { httpResource } from "@angular/common/http";
import { Injectable, computed, signal } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import type { ActivityEventRow } from "../api/models";

/** React `TaskHistoryPanel` shows the newest 12 server events. */
export const TASK_HISTORY_LIMIT = 12;

@Injectable({ providedIn: "root" })
export class TaskHistoryDataService {
  readonly taskId = signal<string | null>(null);

  readonly resource = httpResource(
    () => {
      const id = this.taskId();
      return id
        ? `/api/taskflow/tasks/${encodeURIComponent(id)}/history`
        : undefined;
    },
    {
      defaultValue: [] as ActivityEventRow[],
      parse: (raw) => parseTaskflowEnvelope<ActivityEventRow[]>(raw),
    },
  );

  readonly events = computed(() =>
    this.resource.value().slice(0, TASK_HISTORY_LIMIT),
  );
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());
  readonly hasValue = computed(() => this.resource.hasValue());

  setActiveTask(id: string | null): void {
    this.taskId.set(id);
  }

  reload(): void {
    this.resource.reload();
  }
}
