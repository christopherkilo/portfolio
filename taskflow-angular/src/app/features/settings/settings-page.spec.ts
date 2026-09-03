import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TaskflowApiError } from "../../core/api/envelope";
import { AuthService } from "../../core/auth/auth";
import { NotificationPreferenceMutationsService } from "../../core/data/notification-preference-mutations";
import { NotificationPreferencesDataService } from "../../core/data/notification-preferences-data";
import { UiStateService } from "../../core/state/ui-state";
import {
  stubAuth,
  stubNotificationPreferenceMutations,
  stubNotificationPreferences,
} from "../../testing/data-stubs";
import { SettingsPage } from "./settings-page";

describe("SettingsPage", () => {
  async function render(
    options: {
      prefs?: ReturnType<typeof stubNotificationPreferences>;
      mutations?: ReturnType<typeof stubNotificationPreferenceMutations>;
    } = {},
  ) {
    const prefs = options.prefs ?? stubNotificationPreferences();
    const mutations = options.mutations ?? stubNotificationPreferenceMutations();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideZonelessChangeDetection(),
        UiStateService,
        { provide: AuthService, useValue: stubAuth() },
        { provide: NotificationPreferencesDataService, useValue: prefs },
        { provide: NotificationPreferenceMutationsService, useValue: mutations },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    return {
      fixture,
      page: fixture.componentInstance,
      ui: TestBed.inject(UiStateService),
      mutations,
      prefs,
    };
  }

  it("persists density locally without inventing a server profile write", async () => {
    const { fixture, page, ui } = await render();
    expect(fixture.nativeElement.textContent).toContain("Appearance");
    page.setDensityDraft("compact");
    page.saveAppearance();
    fixture.detectChanges();
    expect(ui.density()).toBe("compact");
    expect(document.documentElement.dataset["density"]).toBe("compact");
    expect(fixture.nativeElement.textContent).toContain(
      "Appearance saved on this device.",
    );
  });

  it("saves week start for the calendar", async () => {
    const { page, ui } = await render();
    page.selectTab("preferences");
    page.setWeekStartDraft("sunday");
    page.savePreferences();
    expect(ui.weekStart()).toBe("sunday");
  });

  it("shows the authenticated account as read-only", async () => {
    const { fixture, page } = await render();
    page.selectTab("account");
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll(
      "input",
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs[0]?.value).toBe("Maya Chen");
    expect(inputs[0]?.readOnly).toBe(true);
    expect(inputs[1]?.value).toBe("maya@example.com");
    expect(inputs[1]?.readOnly).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain("Profile changes saved");
  });

  it("PATCHes notification preferences through the existing API body", async () => {
    const { fixture, page, mutations } = await render();
    page.selectTab("notifications");
    fixture.detectChanges();
    page.togglePref("comments");
    await page.saveNotificationPrefs();
    expect(mutations.save).toHaveBeenCalledWith({
      assignments: true,
      comments: false,
      mentions: true,
      dueDates: true,
      projectChanges: true,
    });
  });

  it("does not fake a save when notification preferences fail", async () => {
    const mutations = stubNotificationPreferenceMutations();
    mutations.save.mockRejectedValue(
      new TaskflowApiError("This action needs an active connection.", {
        status: 503,
        code: "OFFLINE_UNSAFE_ACTION",
      }),
    );
    const { fixture, page } = await render({ mutations });
    page.selectTab("notifications");
    fixture.detectChanges();
    await page.saveNotificationPrefs();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "This action needs an active connection.",
    );
    expect(fixture.nativeElement.querySelector("[role='alert']")).toBeTruthy();
  });
});
