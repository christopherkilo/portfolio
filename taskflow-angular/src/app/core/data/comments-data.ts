import { httpResource } from "@angular/common/http";
import { Injectable, computed, signal } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import type { CommentWithAuthor } from "../api/models";

@Injectable({ providedIn: "root" })
export class CommentsDataService {
  readonly taskId = signal<string | null>(null);

  readonly resource = httpResource(
    () => {
      const id = this.taskId();
      return id
        ? `/api/taskflow/tasks/${encodeURIComponent(id)}/comments`
        : undefined;
    },
    {
      defaultValue: [] as CommentWithAuthor[],
      parse: (raw) => parseTaskflowEnvelope<CommentWithAuthor[]>(raw),
    },
  );

  readonly comments = computed(() => this.resource.value());
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
