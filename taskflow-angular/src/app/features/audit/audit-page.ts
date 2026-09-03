import { Component, computed, inject } from "@angular/core";
import { userFacingLoadError } from "../../core/api/http-error";
import type { ActivityEventRow } from "../../core/api/models";
import { AuditDataService } from "../../core/data/audit-data";
import { formatRelativeTime } from "../../core/data/dates";
import { formatHistoryEvent } from "../../core/data/history-format";
import { findMember } from "../../core/data/read-model";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import {
  EmptyState,
  QueryError,
  QueryLoading,
} from "../../shared/ui/query-states";

@Component({
  selector: "tf-audit-page",
  imports: [EmptyState, QueryError, QueryLoading],
  templateUrl: "./audit-page.html",
  styleUrl: "./audit-page.scss",
})
export class AuditPage {
  readonly audit = inject(AuditDataService);
  readonly permissions = inject(WorkspacePermissionsService);
  readonly reads = inject(WorkspaceReadsService);
  readonly formatRelativeTime = formatRelativeTime;

  readonly loadError = computed(() => {
    const error = this.audit.error();
    return error ? userFacingLoadError(error) : null;
  });

  readonly denied = computed(() => {
    const error = this.loadError();
    return error?.status === 403 || error?.code === "AUDIT_ACCESS_DENIED";
  });

  formatted(event: ActivityEventRow) {
    const actor = event.actor_id
      ? findMember(this.reads.members.members(), event.actor_id)?.name
      : null;
    return formatHistoryEvent(event, actor);
  }

  onEntity(event: Event): void {
    this.audit.setFilters({
      entityType: (event.target as HTMLSelectElement).value,
    });
  }

  onAction(event: Event): void {
    this.audit.setFilters({
      action: (event.target as HTMLInputElement).value,
    });
  }

  retry(): void {
    this.audit.reload();
  }
}
