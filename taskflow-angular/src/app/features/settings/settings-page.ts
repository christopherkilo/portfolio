import { Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { userFacingLoadError } from "../../core/api/http-error";
import { userFacingMutationError } from "../../core/api/mutation-error";
import type { NotificationPreferenceRow } from "../../core/api/models";
import { AuthService } from "../../core/auth/auth";
import { NotificationPreferenceMutationsService } from "../../core/data/notification-preference-mutations";
import { NotificationPreferencesDataService } from "../../core/data/notification-preferences-data";
import {
  UiStateService,
  type TaskflowDensity,
  type WeekStart,
} from "../../core/state/ui-state";
import { QueryError, QueryLoading } from "../../shared/ui/query-states";

export type SettingsTab =
  | "appearance"
  | "notifications"
  | "account"
  | "preferences";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
  { id: "preferences", label: "Preferences" },
];

const PREF_ROWS = [
  ["assignments", "Task assignments"],
  ["comments", "Comments"],
  ["mentions", "Mentions"],
  ["due_dates", "Due dates"],
  ["project_changes", "Project & membership changes"],
] as const;

@Component({
  selector: "tf-settings-page",
  imports: [QueryError, QueryLoading],
  templateUrl: "./settings-page.html",
  styleUrl: "./settings-page.scss",
})
export class SettingsPage {
  readonly ui = inject(UiStateService);
  readonly auth = inject(AuthService);
  readonly prefs = inject(NotificationPreferencesDataService);
  private readonly mutations = inject(NotificationPreferenceMutationsService);

  readonly tabs = TABS;
  readonly prefRows = PREF_ROWS;
  readonly tab = signal<SettingsTab>("appearance");
  readonly densityDraft = signal<TaskflowDensity | null>(null);
  readonly weekStartDraft = signal<WeekStart | null>(null);
  readonly prefOverride = signal<Partial<NotificationPreferenceRow>>({});
  readonly saved = signal("");
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  readonly loadError = computed(() => {
    const error = this.prefs.error();
    return error ? userFacingLoadError(error) : null;
  });

  readonly effectiveDensity = computed(
    () => this.densityDraft() ?? this.ui.density(),
  );
  readonly effectiveWeekStart = computed(
    () => this.weekStartDraft() ?? this.ui.weekStart(),
  );
  readonly effectivePrefs = computed(() => {
    const row = this.prefs.preferences();
    if (!row) return null;
    return { ...row, ...this.prefOverride() };
  });

  readonly displayName = computed(
    () => this.auth.currentUser()?.profile.display_name ?? "",
  );
  readonly email = computed(() => this.auth.currentUser()?.email ?? "");

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.flashTimer) clearTimeout(this.flashTimer);
    });
  }

  selectTab(tab: SettingsTab): void {
    this.tab.set(tab);
    this.saveError.set(null);
  }

  setDensityDraft(value: TaskflowDensity): void {
    this.densityDraft.set(value);
  }

  setWeekStartDraft(value: WeekStart): void {
    this.weekStartDraft.set(value);
  }

  togglePref(key: (typeof PREF_ROWS)[number][0]): void {
    const current = this.effectivePrefs();
    if (!current) return;
    this.prefOverride.update((prev) => ({ ...prev, [key]: !current[key] }));
  }

  saveAppearance(): void {
    this.ui.setDensity(this.effectiveDensity());
    this.densityDraft.set(null);
    this.flash("Appearance saved on this device.");
  }

  savePreferences(): void {
    this.ui.setWeekStart(this.effectiveWeekStart());
    this.weekStartDraft.set(null);
    this.flash("Planning preferences saved.");
  }

  async saveNotificationPrefs(): Promise<void> {
    const current = this.effectivePrefs();
    if (!current || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    try {
      await this.mutations.save({
        assignments: Boolean(current.assignments),
        comments: Boolean(current.comments),
        mentions: Boolean(current.mentions),
        dueDates: Boolean(current.due_dates),
        projectChanges: Boolean(current.project_changes),
      });
      this.prefOverride.set({});
      this.flash("In-app notification preferences saved.");
    } catch (error) {
      this.saveError.set(userFacingMutationError(error).message);
    } finally {
      this.saving.set(false);
    }
  }

  retryPrefs(): void {
    this.prefs.reload();
  }

  private flash(message: string): void {
    this.saved.set(message);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.saved.set(""), 2500);
  }
}
