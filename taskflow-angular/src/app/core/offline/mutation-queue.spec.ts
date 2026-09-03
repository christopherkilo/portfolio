import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { MutationQueueService } from "./mutation-queue";
import {
  ANGULAR_OFFLINE_DB_NAME,
  REACT_OFFLINE_DB_NAME,
} from "./db";
import { resetAngularOfflineMemory } from "./queue-backend";

describe("MutationQueueService", () => {
  afterEach(() => {
    resetAngularOfflineMemory();
  });

  async function createQueue() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), MutationQueueService],
    });
    const queue = TestBed.inject(MutationQueueService);
    await queue.whenReady();
    return queue;
  }

  it("uses the Angular-specific IndexedDB name and never the React name", () => {
    expect(ANGULAR_OFFLINE_DB_NAME).toBe("taskflow-angular-offline-v1");
    expect(ANGULAR_OFFLINE_DB_NAME).not.toBe(REACT_OFFLINE_DB_NAME);
  });

  it("does not open the React offline database", async () => {
    const opened: string[] = [];
    const indexedDB = {
      open(name: string) {
        opened.push(name);
        throw new Error("no idb in test");
      },
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MutationQueueService,
        {
          provide: DOCUMENT,
          useValue: { defaultView: { indexedDB, navigator: { onLine: true } } },
        },
      ],
    });
    const queue = TestBed.inject(MutationQueueService);
    await queue.whenReady();
    await queue.enqueue({
      type: "task_update",
      userId: "user-1",
      workspaceId: "ws-1",
      entityId: "t1",
      payload: { title: "A" },
      expectedVersion: 1,
    });
    expect(opened.every((name) => name !== REACT_OFFLINE_DB_NAME)).toBe(true);
    if (opened.length) {
      expect(opened).toContain(ANGULAR_OFFLINE_DB_NAME);
    }
  });

  it("enqueues a mutation that survives service recreation", async () => {
    const first = await createQueue();
    const created = await first.enqueue({
      type: "task_update",
      userId: "user-a",
      workspaceId: "ws-1",
      entityId: "t1",
      payload: { title: "Offline title" },
      expectedVersion: 8,
    });
    expect(created.status).toBe("pending");
    expect(created.expectedVersion).toBe(8);
    expect(created.payload).not.toHaveProperty("expectedVersion");
    expect(JSON.stringify(created)).not.toMatch(/access_token|service_role|password/i);

    const second = await createQueue();
    const listed = second.list().find((item) => item.id === created.id);
    expect(listed?.payload).toEqual({ title: "Offline title" });
    expect(listed?.expectedVersion).toBe(8);
    expect(listed?.userId).toBe("user-a");
  });

  it("returns the oldest mutation first", async () => {
    const queue = await createQueue();
    const a = await queue.enqueue({
      type: "task_update",
      userId: "user-1",
      workspaceId: "ws-1",
      entityId: "t1",
      payload: { title: "A" },
      expectedVersion: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const b = await queue.enqueue({
      type: "task_status",
      userId: "user-1",
      workspaceId: "ws-1",
      entityId: "t1",
      payload: { status: "done" },
      expectedVersion: 1,
    });
    const ordered = queue.replayableForUser("user-1");
    expect(ordered.map((item) => item.id)).toEqual([a.id, b.id]);
  });

  it("removes a successful mutation and retains failed and conflicted ones", async () => {
    const queue = await createQueue();
    const ok = await queue.enqueue({
      type: "task_update",
      userId: "user-1",
      workspaceId: "ws-1",
      entityId: "t1",
      payload: { title: "ok" },
      expectedVersion: 1,
    });
    const failed = await queue.enqueue({
      type: "task_update",
      userId: "user-1",
      workspaceId: "ws-1",
      entityId: "t2",
      payload: { title: "fail" },
      expectedVersion: 1,
    });
    const conflict = await queue.enqueue({
      type: "task_update",
      userId: "user-1",
      workspaceId: "ws-1",
      entityId: "t3",
      payload: { title: "conflict" },
      expectedVersion: 1,
    });
    await queue.remove(ok.id);
    await queue.update(failed.id, { status: "failed", errorMessage: "500" });
    await queue.update(conflict.id, {
      status: "conflict",
      latest: { version: 9 },
    });
    expect(queue.list().some((item) => item.id === ok.id)).toBe(false);
    expect(queue.list().find((item) => item.id === failed.id)?.status).toBe(
      "failed",
    );
    expect(queue.list().find((item) => item.id === conflict.id)?.latest).toEqual(
      { version: 9 },
    );
    expect(queue.pendingCount()).toBe(0);
    expect(queue.failedCount()).toBe(1);
    expect(queue.conflictedCount()).toBe(1);
  });

  it("refuses to store credential-bearing payloads", async () => {
    const queue = await createQueue();
    await expect(
      queue.enqueue({
        type: "task_update",
        userId: "user-1",
        workspaceId: "ws-1",
        entityId: "t1",
        payload: { title: "x", access_token: "secret" },
        expectedVersion: 1,
      }),
    ).rejects.toThrow(/credentials/i);
  });
});
