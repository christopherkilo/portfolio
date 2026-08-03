import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setConflictDraft = vi.fn();
const setOfflineQueueCounts = vi.fn();
const enqueueMutationMock = vi.fn();
const listQueuedMutationsMock = vi.fn(async () => []);
const taskflowFetchMock = vi.fn();

let mockConnectionStatus: "online" | "reconnecting" | "offline" = "online";

vi.mock("@/lib/demos/taskflow/store", () => ({
  useTaskflowUiStore: {
    getState: () => ({
      connectionStatus: mockConnectionStatus,
      setConflictDraft,
      setOfflineQueueCounts,
      setPendingOfflineCount: vi.fn(),
    }),
  },
}));

vi.mock("@/lib/demos/taskflow/offline/mutationQueue", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/demos/taskflow/offline/mutationQueue")
  >("@/lib/demos/taskflow/offline/mutationQueue");
  return {
    ...actual,
    enqueueMutation: (...args: [unknown]) => enqueueMutationMock(...args),
    listQueuedMutations: () => listQueuedMutationsMock(),
  };
});

vi.mock("@/lib/demos/taskflow/api/client", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/demos/taskflow/api/client")
  >("@/lib/demos/taskflow/api/client");
  return {
    ...actual,
    taskflowFetch: (...args: [string, RequestInit?]) =>
      taskflowFetchMock(...args),
  };
});

describe("TaskFlow safeMutations", () => {
  beforeEach(() => {
    mockConnectionStatus = "online";
    setConflictDraft.mockReset();
    setOfflineQueueCounts.mockReset();
    enqueueMutationMock.mockReset();
    listQueuedMutationsMock.mockReset();
    listQueuedMutationsMock.mockResolvedValue([]);
    taskflowFetchMock.mockReset();
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks unsafe actions while offline", async () => {
    mockConnectionStatus = "offline";
    const { assertOnlineForUnsafeAction } = await import(
      "@/lib/demos/taskflow/offline/safeMutations"
    );
    const { TaskflowApiError } = await import(
      "@/lib/demos/taskflow/api/client"
    );

    expect(() => assertOnlineForUnsafeAction("role_change")).toThrow(
      TaskflowApiError,
    );
    try {
      assertOnlineForUnsafeAction("role_change");
    } catch (error) {
      expect(error).toBeInstanceOf(TaskflowApiError);
      expect((error as InstanceType<typeof TaskflowApiError>).status).toBe(503);
      expect((error as InstanceType<typeof TaskflowApiError>).code).toBe(
        "OFFLINE_UNSAFE_ACTION",
      );
    }
  });

  it("queues task patches when offline", async () => {
    mockConnectionStatus = "offline";
    enqueueMutationMock.mockResolvedValue({ id: "q1" });

    const { patchTaskWithVersion } = await import(
      "@/lib/demos/taskflow/offline/safeMutations"
    );

    const result = await patchTaskWithVersion({
      id: "t1",
      workspaceId: "w1",
      expectedVersion: 3,
      body: { title: "Queued" },
    });

    expect(result).toBe("queued");
    expect(enqueueMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "task_update",
        entityId: "t1",
        workspaceId: "w1",
        expectedVersion: 3,
        payload: { title: "Queued" },
      }),
    );
    expect(taskflowFetchMock).not.toHaveBeenCalled();
  });

  it("sets conflict draft on STALE_VERSION", async () => {
    const { TaskflowApiError } = await import(
      "@/lib/demos/taskflow/api/client"
    );
    const latest = { id: "t1", version: 5, title: "Server wins" };
    taskflowFetchMock.mockRejectedValue(
      new TaskflowApiError("stale", {
        status: 409,
        code: "STALE_VERSION",
        data: { latest },
      }),
    );

    const { patchTaskWithVersion } = await import(
      "@/lib/demos/taskflow/offline/safeMutations"
    );

    await expect(
      patchTaskWithVersion({
        id: "t1",
        workspaceId: "w1",
        expectedVersion: 4,
        body: { title: "Mine" },
      }),
    ).rejects.toBeInstanceOf(TaskflowApiError);

    expect(setConflictDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "task",
        entityId: "t1",
        draft: { title: "Mine" },
        latest,
      }),
    );
  });

  it("refuses project patches offline", async () => {
    mockConnectionStatus = "offline";
    const { patchProjectWithVersion } = await import(
      "@/lib/demos/taskflow/offline/safeMutations"
    );

    await expect(
      patchProjectWithVersion({
        id: "p1",
        expectedVersion: 1,
        body: { name: "Nope" },
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: "OFFLINE_UNSAFE_ACTION",
    });
    expect(taskflowFetchMock).not.toHaveBeenCalled();
  });
});
