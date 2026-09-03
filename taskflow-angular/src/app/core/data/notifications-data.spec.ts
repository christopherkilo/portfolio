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
import { NotificationMutationsService } from "./notification-mutations";
import { NotificationsDataService } from "./notifications-data";
import type { NotificationRow } from "../api/models";
import { stubAuth } from "../../testing/data-stubs";

const unread: NotificationRow = {
  id: "n1",
  user_id: "user-1",
  workspace_id: "ws-1",
  type: "task_assigned",
  entity_type: "task",
  entity_id: "11111111-1111-4111-8111-111111111111",
  actor_id: "user-2",
  title: "You were assigned a task",
  message: "Write launch checklist",
  occurrence_count: 1,
  last_occurred_at: "2026-09-01T12:00:00.000Z",
  read_at: null,
  created_at: "2026-09-01T12:00:00.000Z",
};

describe("NotificationsDataService", () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        NotificationsDataService,
        { provide: AuthService, useValue: stubAuth() },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("loads notifications and derives unread count", async () => {
    const service = TestBed.inject(NotificationsDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/notifications").flush({
      success: true,
      data: [unread, { ...unread, id: "n2", read_at: "2026-09-01T13:00:00.000Z" }],
    });
    await Promise.resolve();
    expect(service.notifications()).toHaveLength(2);
    expect(service.unreadCount()).toBe(1);
  });

  it("clears notification state when the session ends", async () => {
    const auth = TestBed.inject(AuthService) as unknown as ReturnType<
      typeof stubAuth
    >;
    const service = TestBed.inject(NotificationsDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/notifications").flush({
      success: true,
      data: [unread],
    });
    await Promise.resolve();
    expect(service.unreadCount()).toBe(1);
    auth.status.set("unauthenticated");
    auth.currentUser.set(null);
    TestBed.inject(ApplicationRef).tick();
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
    http.expectNone("/api/taskflow/notifications");
  });
});

describe("NotificationMutationsService", () => {
  let http: HttpTestingController;
  let service: NotificationMutationsService;
  const reload = vi.fn();

  beforeEach(() => {
    reload.mockReset();
    resetAngularOfflineMemory();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        NotificationMutationsService,
        MutationQueueService,
        { provide: NotificationsDataService, useValue: { reload } },
        { provide: AuthService, useValue: stubAuth() },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(NotificationMutationsService);
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it("marks one read then reloads", async () => {
    const pending = service.markRead("n1");
    const req = http.expectOne("/api/taskflow/notifications/n1/read");
    expect(req.request.method).toBe("PATCH");
    req.flush({ success: true, data: { ...unread, read_at: "2026-09-01T13:00:00.000Z" } });
    await pending;
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload when mark-read fails", async () => {
    const pending = service.markRead("n1");
    http.expectOne("/api/taskflow/notifications/n1/read").flush(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "nope", fieldErrors: {} },
      },
      { status: 500, statusText: "Server Error" },
    );
    await expect(pending).rejects.toMatchObject({ status: 500 });
    expect(reload).not.toHaveBeenCalled();
  });

  it("marks all read", async () => {
    const pending = service.markAllRead();
    http.expectOne("/api/taskflow/notifications/read-all").flush({
      success: true,
      data: { count: 3 },
    });
    await expect(pending).resolves.toEqual({ count: 3 });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("keeps notification_read online-only", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const queue = TestBed.inject(MutationQueueService);
    await expect(service.markRead("n1")).rejects.toMatchObject({
      code: "OFFLINE_UNSAFE_ACTION",
    });
    expect(queue.list()).toEqual([]);
  });
});
