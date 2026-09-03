import { TestBed } from "@angular/core/testing";
import {
  ApplicationRef,
  Component,
  effect,
  inject,
  provideZonelessChangeDetection,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { RealtimeService } from "./realtime";
import { TaskflowRealtimeClientFactory } from "./client-factory";
import { workspaceChannelName } from "./workspace-channel";
import { createFakeRealtimeClient } from "../../testing/fake-realtime-client";

@Component({
  standalone: true,
  template: "",
})
class RealtimeStartHost {
  private readonly realtime = inject(RealtimeService);
  constructor() {
    effect(() => {
      void this.realtime.start("w1", "u1", self);
    });
  }
}

const self = {
  userId: "u1",
  displayName: "Ada Lovelace",
  avatarUrl: "https://example.com/a.png",
  workspaceId: "w1",
  currentView: "/tasks",
  currentEntityId: null as string | null,
};

describe("RealtimeService", () => {
  let fake: ReturnType<typeof createFakeRealtimeClient>;
  let service: RealtimeService;

  beforeEach(() => {
    fake = createFakeRealtimeClient();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RealtimeStartHost],
      providers: [
        provideZonelessChangeDetection(),
        RealtimeService,
        {
          provide: TaskflowRealtimeClientFactory,
          useValue: { create: vi.fn().mockResolvedValue(fake.client) },
        },
      ],
    });
    service = TestBed.inject(RealtimeService);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await service.stop();
  });

  it("does not open a channel until start() is called", () => {
    expect(service.hasChannel()).toBe(false);
    expect(fake.channel).not.toHaveBeenCalled();
    expect(service.connectionStatus()).toBe("offline");
  });

  it("does not re-enter start when an effect observes connectionStatus writes", async () => {
    const fixture = TestBed.createComponent(RealtimeStartHost);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(fake.channel).toHaveBeenCalledTimes(1);
    expect(service.connectionStatus()).toBe("online");
  });

  it("opens one workspace channel and no-ops duplicate start", async () => {
    await service.start("w1", "u1", self);
    await service.start("w1", "u1", self);
    expect(fake.channel).toHaveBeenCalledTimes(1);
    expect(fake.channel).toHaveBeenCalledWith(
      workspaceChannelName("w1"),
      expect.objectContaining({
        config: { presence: { key: "u1" } },
      }),
    );
    expect(service.hasChannel()).toBe(true);
    expect(service.connectionStatus()).toBe("online");
  });

  it("leaves the previous channel when the workspace changes", async () => {
    await service.start("w1", "u1", self);
    const first = fake.latest();
    const seen: string[] = [];
    service.invalidations$.subscribe((event) => seen.push(event.table));
    await service.start("w2", "u1", { ...self, workspaceId: "w2" });
    expect(fake.removeChannel).toHaveBeenCalled();
    expect(fake.latest()?.name).toBe(workspaceChannelName("w2"));
    first?.emitPostgres("tasks", { new: { id: "t1" } });
    expect(seen).toEqual([]);
  });

  it("clears the channel and presence on stop (logout)", async () => {
    await service.start("w1", "u1", self);
    fake.latest()?.emitPresence({
      u1: [{ ...self, lastActiveAt: "2026-09-01T00:00:00.000Z" }],
    });
    expect(service.presenceUsers()).toHaveLength(1);
    await service.stop();
    expect(service.hasChannel()).toBe(false);
    expect(service.presenceUsers()).toEqual([]);
    expect(service.connectionStatus()).toBe("offline");
    expect(service.getSelfPayload()).toBeNull();
  });

  it("maps connected subscribe status to online", async () => {
    await service.start("w1", "u1", self);
    expect(service.connectionStatus()).toBe("online");
  });

  it("reconnects after an unexpected close and emits reconnects$", async () => {
    vi.useFakeTimers();
    await service.start("w1", "u1", self);
    const reconnects: string[] = [];
    service.reconnects$.subscribe((event) => reconnects.push(event.workspaceId));
    fake.latest()?.subscribeCb?.("CLOSED");
    expect(service.connectionStatus()).toBe("reconnecting");
    await vi.advanceTimersByTimeAsync(1000);
    expect(fake.channel).toHaveBeenCalledTimes(2);
    expect(reconnects).toEqual(["w1"]);
    expect(service.connectionStatus()).toBe("online");
  });

  it("exposes bounded reconnect backoff", () => {
    expect(RealtimeService.backoffDelayMs(0)).toBe(1000);
    expect(RealtimeService.backoffDelayMs(99)).toBe(30_000);
  });

  it("tracks presence without credentials and uses metas[0] on sync", async () => {
    await service.start("w1", "u1", self);
    const tracked = fake.latest()?.tracked[0];
    expect(tracked?.displayName).toBe("Ada Lovelace");
    expect(JSON.stringify(tracked)).not.toContain("secret");
    fake.latest()?.emitPresence({
      u1: [
        {
          ...self,
          lastActiveAt: "2026-09-01T00:00:00.000Z",
          currentView: "/tasks",
        },
        {
          ...self,
          lastActiveAt: "2026-09-01T00:00:01.000Z",
          currentView: "/projects",
        },
      ],
    });
    expect(service.presenceUsers()).toHaveLength(1);
    expect(service.presenceUsers()[0]?.currentView).toBe("/tasks");
  });

  it("preserves authoritative self presence across updatePresence", async () => {
    await service.start("w1", "u1", self);
    await service.updatePresence({ currentEntityId: "task-9" });
    const payload = service.getSelfPayload();
    expect(payload?.displayName).toBe("Ada Lovelace");
    expect(payload?.avatarUrl).toBe("https://example.com/a.png");
    expect(payload?.currentEntityId).toBe("task-9");
  });

  it("emits table invalidations without writing entities", async () => {
    await service.start("w1", "u1", self);
    const event = firstValueFrom(service.invalidations$);
    fake.latest()?.emitPostgres("tasks", {
      new: { id: "t1", title: "from realtime payload" },
    });
    await expect(event).resolves.toMatchObject({
      table: "tasks",
      workspaceId: "w1",
    });
  });
});
