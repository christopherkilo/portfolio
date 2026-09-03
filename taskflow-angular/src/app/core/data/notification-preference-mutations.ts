import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  unwrapTaskflowEnvelope,
} from "../api/envelope";
import { catchTaskflowHttp } from "../api/http-rx";
import type { NotificationPreferenceRow } from "../api/models";
import { assertOnlineForUnsafeAction } from "../offline/offline-unsafe";
import { NotificationPreferencesDataService } from "./notification-preferences-data";

export type NotificationPreferenceWrite = {
  assignments: boolean;
  comments: boolean;
  mentions: boolean;
  dueDates: boolean;
  projectChanges: boolean;
};

@Injectable({ providedIn: "root" })
export class NotificationPreferenceMutationsService {
  private readonly http = inject(HttpClient);
  private readonly preferences = inject(NotificationPreferencesDataService);

  async save(body: NotificationPreferenceWrite): Promise<NotificationPreferenceRow> {
    assertOnlineForUnsafeAction("notification_preferences");
    const row = await firstValueFrom(
      this.http
        .patch<ApiSuccess<NotificationPreferenceRow> | ApiFailure>(
          "/api/taskflow/notification-preferences",
          body,
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.preferences.reload();
    return row;
  }
}
