import { httpResource } from "@angular/common/http";
import { Injectable, computed, signal } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import { mapAttachment } from "../api/mappers";
import type { TaskAttachment, TaskAttachmentRow } from "../api/models";

@Injectable({ providedIn: "root" })
export class AttachmentsDataService {
  readonly taskId = signal<string | null>(null);

  readonly resource = httpResource(
    () => {
      const id = this.taskId();
      return id
        ? `/api/taskflow/tasks/${encodeURIComponent(id)}/attachments`
        : undefined;
    },
    {
      defaultValue: [] as TaskAttachmentRow[],
      parse: (raw) => parseTaskflowEnvelope<TaskAttachmentRow[]>(raw),
    },
  );

  readonly attachments = computed<TaskAttachment[]>(() =>
    this.resource.value().map(mapAttachment),
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
