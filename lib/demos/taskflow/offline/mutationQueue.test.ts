import { afterEach, describe, expect, it } from "vitest";
import {
  enqueueMutation,
  isSafeOfflineMutation,
  listQueuedMutations,
  removeQueuedMutation,
  UNSAFE_OFFLINE_ACTIONS,
  updateQueuedMutation,
} from "@/lib/demos/taskflow/offline/mutationQueue";

async function clearQueue() {
  const items = await listQueuedMutations();
  await Promise.all(items.map((item) => removeQueuedMutation(item.id)));
}

describe("TaskFlow offline mutationQueue", () => {
  afterEach(async () => {
    await clearQueue();
  });

  it("enqueues, lists, updates, and removes (memory fallback when IDB unavailable)", async () => {
    expect(typeof indexedDB === "undefined" || indexedDB === undefined).toBe(
      true,
    );

    const created = await enqueueMutation({
      type: "task_update",
      entityId: "task-1",
      workspaceId: "ws-queue-test",
      payload: { title: "Offline title" },
      expectedVersion: 2,
    });

    expect(created.id).toBeTruthy();
    expect(created.status).toBe("pending");
    expect(created.retryCount).toBe(0);
    expect(created.expectedVersion).toBe(2);

    const listed = await listQueuedMutations();
    expect(listed.some((m) => m.id === created.id)).toBe(true);

    await updateQueuedMutation(created.id, {
      status: "failed",
      errorMessage: "network",
      retryCount: 1,
    });

    const afterUpdate = (await listQueuedMutations()).find(
      (m) => m.id === created.id,
    );
    expect(afterUpdate?.status).toBe("failed");
    expect(afterUpdate?.errorMessage).toBe("network");
    expect(afterUpdate?.retryCount).toBe(1);

    await removeQueuedMutation(created.id);
    const afterRemove = await listQueuedMutations();
    expect(afterRemove.some((m) => m.id === created.id)).toBe(false);
  });

  it("classifies safe offline mutation types", () => {
    expect(isSafeOfflineMutation("task_update")).toBe(true);
    expect(isSafeOfflineMutation("task_status")).toBe(true);
    expect(isSafeOfflineMutation("comment_create")).toBe(true);
    expect(isSafeOfflineMutation("notification_read")).toBe(true);
    expect(UNSAFE_OFFLINE_ACTIONS.has("member_role")).toBe(true);
    expect(UNSAFE_OFFLINE_ACTIONS.has("attachment_delete")).toBe(true);
  });
});
