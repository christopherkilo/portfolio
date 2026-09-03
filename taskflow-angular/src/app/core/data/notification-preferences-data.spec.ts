import { TestBed } from "@angular/core/testing";
import { ApplicationRef, provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { AuthService } from "../auth/auth";
import { MutationQueueService } from "../offline/mutation-queue";
import { resetAngularOfflineMemory } from "../offline/queue-backend";
import { NotificationPreferenceMutationsService } from "./notification-preference-mutations";
import { NotificationPreferencesDataService } from "./notification-preferences-data";
import type { NotificationPreferenceRow } from "../api/models";
import { stubAuth } from "../../testing/data-stubs";

const row: NotificationPreferenceRow = {
  user_id: "user-1",
  assignments: true,
  comments: true,
  mentions: false,
  due_dates: true,
  project_changes: false,
  updated_at: "2026-09-01T12:00:00.000Z",
};

describe("NotificationPreferencesDataService", () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        NotificationPreferencesDataService,
        { provide: AuthService, useValue: stubAuth() },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("loads the current user's preferences", async () => {
    const service = TestBed.inject(NotificationPreferencesDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/notification-preferences").flush({
      success: true,
      data: row,
    });
    await Promise.resolve();
    expect(service.preferences()?.due_dates).toBe(true);
    expect(service.preferences()?.project_changes).toBe(false);
  });

  it("clears preferences when the session ends", async () => {
    const auth = TestBed.inject(AuthService) as unknown as ReturnType<
      typeof stubAuth
    >;
    const service = TestBed.inject(NotificationPreferencesDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/notification-preferences").flush({
      success: true,
      data: row,
    });
    await Promise.resolve();
    auth.status.set("unauthenticated");
    auth.currentUser.set(null);
    TestBed.inject(ApplicationRef).tick();
    expect(service.preferences()).toBeNull();
    http.expectNone("/api/taskflow/notification-preferences");
  });
});

describe("NotificationPreferenceMutationsService", () => {
  let http: HttpTestingController;
  const reload = vi.fn();

  beforeEach(() => {
    resetAngularOfflineMemory();
    reload.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        NotificationPreferenceMutationsService,
        MutationQueueService,
        { provide: AuthService, useValue: stubAuth() },
        {
          provide: NotificationPreferencesDataService,
          useValue: { reload },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    resetAngularOfflineMemory();
    vi.unstubAllGlobals();
  });

  it("PATCHes camelCase fields and reloads", async () => {
    const service = TestBed.inject(NotificationPreferenceMutationsService);
    const pending = service.save({
      assignments: true,
      comments: false,
      mentions: true,
      dueDates: false,
      projectChanges: true,
    });
    const req = http.expectOne("/api/taskflow/notification-preferences");
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({
      assignments: true,
      comments: false,
      mentions: true,
      dueDates: false,
      projectChanges: true,
    });
    req.flush({ success: true, data: row });
    await pending;
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not queue preference writes while offline", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const service = TestBed.inject(NotificationPreferenceMutationsService);
    const queue = TestBed.inject(MutationQueueService);
    await expect(
      service.save({
        assignments: true,
        comments: true,
        mentions: true,
        dueDates: true,
        projectChanges: true,
      }),
    ).rejects.toMatchObject({ code: "OFFLINE_UNSAFE_ACTION" });
    expect(queue.list()).toEqual([]);
  });
});
