import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { TaskflowApiError } from "../../core/api/envelope";
import type { TaskflowNotification } from "../../core/api/models";
import { NotificationMutationsService } from "../../core/data/notification-mutations";
import { NotificationsDataService } from "../../core/data/notifications-data";
import { NetworkStatusService } from "../../core/realtime/network-status";
import {
  stubNotificationMutations,
  stubNotifications,
} from "../../testing/data-stubs";
import { NotificationMenu } from "./notification-menu";

const TASK_ID = "11111111-1111-4111-8111-111111111111";

const unread: TaskflowNotification = {
  id: "n1",
  type: "task_assigned",
  entityType: "task",
  entityId: TASK_ID,
  title: "You were assigned a task",
  message: "Write launch checklist",
  occurrenceCount: 1,
  lastOccurredAt: "2026-09-01T12:00:00.000Z",
  createdAt: "2026-09-01T12:00:00.000Z",
  readAt: null,
};

describe("NotificationMenu", () => {
  async function render(
    options: {
      notifications?: ReturnType<typeof stubNotifications>;
      mutations?: ReturnType<typeof stubNotificationMutations>;
    } = {},
  ) {
    const notifications =
      options.notifications ?? stubNotifications({ notifications: [unread] });
    const mutations = options.mutations ?? stubNotificationMutations();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [NotificationMenu],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: "tasks", children: [] }]),
        { provide: NotificationsDataService, useValue: notifications },
        { provide: NotificationMutationsService, useValue: mutations },
        { provide: NetworkStatusService, useValue: { online: signal(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotificationMenu);
    fixture.detectChanges();
    return { fixture, notifications, mutations, router: TestBed.inject(Router) };
  }

  it("names the trigger with unread count", async () => {
    const { fixture } = await render();
    const button = fixture.nativeElement.querySelector("button");
    expect(button?.getAttribute("aria-label")).toBe("Notifications, 1 unread");
  });

  it("navigates task notifications through the Angular task detail query", async () => {
    const { fixture, mutations, router } = await render();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.componentInstance.onItem(unread);
    expect(mutations.markRead).toHaveBeenCalledWith("n1");
    expect(router.url).toContain("/tasks");
    expect(router.url).toContain(TASK_ID);
  });

  it("does not follow an unsafe entity id", async () => {
    const unsafe: TaskflowNotification = {
      ...unread,
      entityId: "https://evil.example",
    };
    const { fixture, router } = await render({
      notifications: stubNotifications({ notifications: [unsafe] }),
    });
    await fixture.componentInstance.onItem(unsafe);
    expect(router.url).not.toContain("evil");
  });

  it("does not fake unread state when mark-read fails", async () => {
    const mutations = stubNotificationMutations();
    mutations.markRead.mockRejectedValue(
      new TaskflowApiError("nope", { status: 500, code: "INTERNAL_ERROR" }),
    );
    const notifications = stubNotifications({ notifications: [unread] });
    const { fixture } = await render({ notifications, mutations });
    await fixture.componentInstance.onItem(unread);
    expect(notifications.unreadCount()).toBe(1);
    expect(notifications.reload).not.toHaveBeenCalled();
  });
});
