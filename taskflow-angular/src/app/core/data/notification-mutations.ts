import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  unwrapTaskflowEnvelope,
} from "../api/envelope";
import { catchTaskflowHttp } from "../api/http-rx";
import { mapNotification } from "../api/mappers";
import type { NotificationRow, TaskflowNotification } from "../api/models";
import { assertOnlineForUnsafeAction } from "../offline/offline-unsafe";
import { NotificationsDataService } from "./notifications-data";

@Injectable({ providedIn: "root" })
export class NotificationMutationsService {
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationsDataService);

  async markRead(id: string): Promise<TaskflowNotification> {
    assertOnlineForUnsafeAction("notification_read");
    const row = await firstValueFrom(
      this.http
        .patch<ApiSuccess<NotificationRow> | ApiFailure>(
          `/api/taskflow/notifications/${id}/read`,
          {},
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.notifications.reload();
    return mapNotification(row);
  }

  async markAllRead(): Promise<{ count: number }> {
    assertOnlineForUnsafeAction("notification_read");
    const result = await firstValueFrom(
      this.http
        .post<ApiSuccess<{ count: number }> | ApiFailure>(
          "/api/taskflow/notifications/read-all",
          {},
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.notifications.reload();
    return result;
  }
}
