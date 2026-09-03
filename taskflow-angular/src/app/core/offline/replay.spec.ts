import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Subject } from "rxjs";
import { DOCUMENT } from "@angular/common";
import { AuthService } from "../auth/auth";
import { ActivityDataService } from "../data/activity-data";
import { MembersDataService } from "../data/members-data";
import { TasksDataService } from "../data/tasks-data";
import { NetworkStatusService } from "../realtime/network-status";
import { RealtimeService } from "../realtime/realtime";
import { MutationQueueService } from "./mutation-queue";
import { OfflineReplayService } from "./replay";
import { resetAngularOfflineMemory } from "./queue-backend";
import { REPLAY_LOCK_NAME } from "./db";
import { stubAuth } from "../../testing/data-stubs";
import type { QueuedMutation } from "./queued-mutation";

describe("OfflineReplayService", () => {
  const online = signal(true);
  const reconnects$ = new Subject<{ workspaceId: string }>();
  const tasksReload = vi.fn();
  const activityReload = vi.fn();
  const membersReload = vi.fn();

  afterEach(() => {
    resetAngularOfflineMemory();
  });

  async function setup(options?: {
    status?: "checking" | "authenticated" | "unauthenticated";
    userId?: string | null;
    online?: boolean;
    locks?: LockManager;
  }) {
    tasksReload.mockReset();
    activityReload.mockReset();
    membersReload.mockReset();
    online.set(options?.online ?? true);
    const auth = stubAuth({
      status: options?.status ?? "authenticated",
      user:
        options?.status === "unauthenticated" || options?.status === "checking"
          ? null
          : {
              id: options?.userId ?? "user-1",
              email: "maya@example.com",
              profile: { display_name: "Maya Chen", avatar_url: null },
            },
    });
    if (options?.status === "checking") {
      auth.status.set("checking");
    }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        MutationQueueService,
        OfflineReplayService,
        { provide: AuthService, useValue: auth },
        { provide: NetworkStatusService, useValue: { online } },
        {
          provide: RealtimeService,
          useValue: { reconnects$ },
        },
        { provide: TasksDataService, useValue: { reload: tasksReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
        { provide: MembersDataService, useValue: { reload: membersReload } },
        {
          provide: DOCUMENT,
          useValue: {
            defaultView: {
              indexedDB: undefined,
              navigator: { locks: options?.locks, onLine: true },
            },
          },
        },
      ],
    });
    const queue = TestBed.inject(MutationQueueService);
    const replay = TestBed.inject(OfflineReplayService);
    const http = TestBed.inject(HttpTestingController);
    await queue.whenReady();
    return { auth, queue, replay, http };
  }

  async function tick(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  async function enqueue(
    queue: MutationQueueService,
    patch: Partial<QueuedMutation> & { entityId: string; payload: Record<string, unknown> },
  ) {
    return queue.enqueue({
      type: patch.type ?? "task_update",
      userId: patch.userId ?? "user-1",
      workspaceId: patch.workspaceId ?? "ws-1",
      entityId: patch.entityId,
      payload: patch.payload,
      expectedVersion: patch.expectedVersion ?? 8,
    });
  }

  it("does not replay while auth is checking or signed out", async () => {
    const checking = await setup({ status: "checking" });
    await enqueue(checking.queue, { entityId: "t1", payload: { title: "A" } });
    await checking.replay.tryReplay();
    checking.http.verify();

    const signedOut = await setup({ status: "unauthenticated" });
    await enqueue(signedOut.queue, { entityId: "t1", payload: { title: "A" } });
    await signedOut.replay.tryReplay();
    signedOut.http.verify();
  });

  it("replays oldest-first sequentially and reloads after success", async () => {
    const { queue, replay, http } = await setup();
    const first = await enqueue(queue, {
      entityId: "t1",
      payload: { title: "A" },
      expectedVersion: 8,
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await enqueue(queue, {
      entityId: "t2",
      payload: { title: "B" },
      expectedVersion: 1,
    });
    const pending = replay.tryReplay();
    await tick();
    const req1 = http.expectOne("/api/tasks/t1");
    expect(http.match("/api/tasks/t2")).toEqual([]);
    expect(req1.request.body).toEqual({ title: "A", expectedVersion: 8 });
    req1.flush({ success: true, data: { id: "t1" } });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const req2 = http.expectOne("/api/tasks/t2");
    expect(req2.request.body).toEqual({ title: "B", expectedVersion: 1 });
    req2.flush({ success: true, data: { id: "t2" } });
    await pending;
    expect(queue.list().some((item) => item.id === first.id)).toBe(false);
    expect(queue.list().some((item) => item.id === second.id)).toBe(false);
    expect(tasksReload).toHaveBeenCalled();
    expect(activityReload).toHaveBeenCalled();
  });

  it("does not start a second replay loop while one is in flight", async () => {
    const { queue, replay, http } = await setup();
    await enqueue(queue, { entityId: "t1", payload: { title: "A" } });
    const first = replay.tryReplay();
    const second = replay.tryReplay();
    await tick();
    const inFlight = http.match("/api/tasks/t1");
    expect(inFlight).toHaveLength(1);
    inFlight[0]?.flush({ success: true, data: { id: "t1" } });
    await Promise.all([first, second]);
    http.verify();
  });

  it("preserves expectedVersion N and marks conflict on 409 without rebasing", async () => {
    const { queue, replay, http } = await setup();
    const item = await enqueue(queue, {
      entityId: "t1",
      payload: { title: "Mine" },
      expectedVersion: 8,
    });
    const pending = replay.tryReplay();
    await tick();
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: {
          code: "STALE_VERSION",
          message: "stale",
          fieldErrors: {},
        },
        data: { latest: { id: "t1", version: 9, title: "Server" } },
      },
      { status: 409, statusText: "Conflict" },
    );
    await pending;
    const stored = queue.list().find((row) => row.id === item.id);
    expect(stored?.status).toBe("conflict");
    expect(stored?.expectedVersion).toBe(8);
    expect(stored?.latest).toEqual({ id: "t1", version: 9, title: "Server" });
    expect(queue.conflictedCount()).toBe(1);
  });

  it("stops after a blocking failure and leaves later entries pending", async () => {
    const { queue, replay, http } = await setup();
    await enqueue(queue, { entityId: "t1", payload: { title: "A" } });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const later = await enqueue(queue, { entityId: "t2", payload: { title: "B" } });
    const pending = replay.tryReplay();
    await tick();
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "boom", fieldErrors: {} },
      },
      { status: 500, statusText: "Server Error" },
    );
    await pending;
    expect(http.match("/api/tasks/t2")).toEqual([]);
    expect(queue.list().find((row) => row.entityId === "t1")?.status).toBe(
      "failed",
    );
    expect(queue.list().find((row) => row.id === later.id)?.status).toBe(
      "pending",
    );
  });

  it("stops on 401 without marking the mutation failed", async () => {
    const { queue, replay, http } = await setup();
    const item = await enqueue(queue, { entityId: "t1", payload: { title: "A" } });
    const pending = replay.tryReplay();
    await tick();
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "nope", fieldErrors: {} },
      },
      { status: 401, statusText: "Unauthorized" },
    );
    await pending;
    expect(queue.list().find((row) => row.id === item.id)?.status).toBe(
      "pending",
    );
  });

  it("marks 403 failed, reloads members, and does not bypass security", async () => {
    const { queue, replay, http } = await setup();
    await enqueue(queue, { entityId: "t1", payload: { title: "A" } });
    const pending = replay.tryReplay();
    await tick();
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "viewer", fieldErrors: {} },
      },
      { status: 403, statusText: "Forbidden" },
    );
    await pending;
    expect(queue.list()[0]?.status).toBe("failed");
    expect(membersReload).toHaveBeenCalled();
  });

  it("keeps the entry pending on transport failure", async () => {
    const { queue, replay, http } = await setup();
    const item = await enqueue(queue, { entityId: "t1", payload: { title: "A" } });
    const pending = replay.tryReplay();
    await tick();
    http.expectOne("/api/tasks/t1").error(new ProgressEvent("error"));
    await pending;
    expect(queue.list().find((row) => row.id === item.id)?.status).toBe(
      "pending",
    );
  });

  it("never replays user A work as user B", async () => {
    const { queue, replay, http } = await setup({ userId: "user-b" });
    await enqueue(queue, {
      userId: "user-a",
      entityId: "t1",
      payload: { title: "A" },
    });
    await replay.tryReplay();
    http.verify();
    expect(queue.list()).toHaveLength(1);
  });

  it("does not rewrite workspace context from the current UI workspace", async () => {
    const { queue, replay, http } = await setup();
    await enqueue(queue, {
      workspaceId: "ws-original",
      entityId: "t1",
      payload: { title: "A" },
      expectedVersion: 4,
    });
    const pending = replay.tryReplay();
    await tick();
    const req = http.expectOne("/api/tasks/t1");
    expect(req.request.body.expectedVersion).toBe(4);
    expect(queue.list()[0]?.workspaceId).toBe("ws-original");
    req.flush({ success: true, data: { id: "t1" } });
    await pending;
  });

  it("does not replay while the browser is offline", async () => {
    const { queue, replay, http } = await setup({ online: false });
    await enqueue(queue, { entityId: "t1", payload: { title: "A" } });
    await replay.tryReplay();
    http.verify();
  });

  it("uses the Web Locks name and releases after work", async () => {
    let held = false;
    let released = false;
    const locks = {
      request: vi.fn(async (_name: string, _opts: unknown, cb: () => Promise<void>) => {
        expect(_name).toBe(REPLAY_LOCK_NAME);
        held = true;
        try {
          await cb();
        } finally {
          held = false;
          released = true;
        }
      }),
    } as unknown as LockManager;
    const { queue, replay, http } = await setup({ locks });
    await enqueue(queue, { entityId: "t1", payload: { title: "A" } });
    const pending = replay.tryReplay();
    await tick();
    http.expectOne("/api/tasks/t1").flush({ success: true, data: { id: "t1" } });
    await pending;
    expect(locks.request).toHaveBeenCalled();
    expect(held).toBe(false);
    expect(released).toBe(true);
  });
});
