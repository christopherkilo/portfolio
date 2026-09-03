import { httpResource } from "@angular/common/http";
import { Injectable, computed, inject } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import { mapNotification } from "../api/mappers";
import type { NotificationRow, TaskflowNotification } from "../api/models";
import { AuthService } from "../auth/auth";

@Injectable({ providedIn: "root" })
export class NotificationsDataService {
  private readonly auth = inject(AuthService);

  readonly resource = httpResource(
    () =>
      this.auth.isAuthenticated()
        ? "/api/taskflow/notifications"
        : undefined,
    {
      defaultValue: [] as NotificationRow[],
      parse: (raw) => parseTaskflowEnvelope<NotificationRow[]>(raw),
    },
  );

  readonly notifications = computed<TaskflowNotification[]>(() =>
    this.resource.value().map(mapNotification),
  );
  readonly unreadCount = computed(
    () => this.notifications().filter((item) => !item.readAt).length,
  );
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());
  readonly hasValue = computed(() => this.resource.hasValue());

  reload(): void {
    this.resource.reload();
  }
}
