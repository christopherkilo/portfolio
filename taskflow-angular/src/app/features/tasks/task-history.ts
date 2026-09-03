import { Component, computed, inject } from "@angular/core";
import { userFacingLoadError } from "../../core/api/http-error";
import type { ActivityEventRow } from "../../core/api/models";
import { formatRelativeTime } from "../../core/data/dates";
import { formatHistoryEvent } from "../../core/data/history-format";
import { findMember } from "../../core/data/read-model";
import { TaskHistoryDataService } from "../../core/data/task-history-data";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";

@Component({
  selector: "tf-task-history",
  templateUrl: "./task-history.html",
  styleUrl: "./task-history.scss",
})
export class TaskHistory {
  readonly history = inject(TaskHistoryDataService);
  private readonly reads = inject(WorkspaceReadsService);
  readonly formatRelativeTime = formatRelativeTime;

  readonly loadError = computed(() => {
    const error = this.history.error();
    return error ? userFacingLoadError(error) : null;
  });

  formatted(event: ActivityEventRow) {
    const actor = event.actor_id
      ? findMember(this.reads.members.members(), event.actor_id)?.name
      : null;
    return formatHistoryEvent(event, actor);
  }

  retry(): void {
    this.history.reload();
  }
}
