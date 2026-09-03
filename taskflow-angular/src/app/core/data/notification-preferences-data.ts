import { httpResource } from "@angular/common/http";
import { Injectable, computed, inject } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import type { NotificationPreferenceRow } from "../api/models";
import { AuthService } from "../auth/auth";

@Injectable({ providedIn: "root" })
export class NotificationPreferencesDataService {
  private readonly auth = inject(AuthService);

  readonly resource = httpResource(
    () =>
      this.auth.isAuthenticated()
        ? { url: "/api/taskflow/notification-preferences" }
        : undefined,
    {
      defaultValue: undefined as NotificationPreferenceRow | undefined,
      parse: (raw) => parseTaskflowEnvelope<NotificationPreferenceRow>(raw),
    },
  );

  readonly preferences = computed(() => this.resource.value() ?? null);
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());
  readonly hasValue = computed(() => this.resource.hasValue());

  reload(): void {
    this.resource.reload();
  }
}
