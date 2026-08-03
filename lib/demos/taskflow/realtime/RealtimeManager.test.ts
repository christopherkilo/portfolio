import { beforeEach, describe, expect, it, vi } from "vitest";
import { PRESENCE_SAFE_FIELDS } from "@/lib/demos/taskflow/realtime/presenceChannel";
import {
  workspaceChannelName,
  WORKSPACE_CHANNEL_PREFIX,
} from "@/lib/demos/taskflow/realtime/workspaceChannel";

const channelMock = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn((cb?: (status: string) => void) => {
    cb?.("SUBSCRIBED");
    return channelMock;
  }),
  track: vi.fn().mockResolvedValue("ok"),
  presenceState: vi.fn(() => ({})),
};

const removeChannel = vi.fn().mockResolvedValue(undefined);
const channel = vi.fn(() => channelMock);

vi.mock("@/lib/demos/taskflow/supabase/browser", () => ({
  createTaskflowBrowserClient: () => ({
    channel,
    removeChannel,
  }),
}));

describe("TaskFlow RealtimeManager (unit, no live Supabase)", () => {
  beforeEach(() => {
    channel.mockClear();
    removeChannel.mockClear();
    channelMock.on.mockClear();
    channelMock.subscribe.mockClear();
    channelMock.track.mockClear();
  });

  it("names workspace channels consistently", () => {
    expect(WORKSPACE_CHANNEL_PREFIX).toBe("taskflow-workspace-");
    expect(workspaceChannelName("abc")).toBe("taskflow-workspace-abc");
  });

  it("exposes only safe presence fields", () => {
    expect([...PRESENCE_SAFE_FIELDS]).toEqual([
      "userId",
      "displayName",
      "avatarUrl",
      "workspaceId",
      "currentView",
      "currentEntityId",
      "lastActiveAt",
    ]);
  });

  it("prevents duplicate start for the same workspace and user", async () => {
    const { RealtimeManager } = await import(
      "@/lib/demos/taskflow/realtime/RealtimeManager"
    );
    const manager = new RealtimeManager();
    const self = {
      userId: "u1",
      displayName: "Ada",
      workspaceId: "w1",
      currentView: "tasks",
      currentEntityId: null,
    };

    await manager.start("w1", "u1", self);
    await manager.start("w1", "u1", self);

    expect(channel).toHaveBeenCalledTimes(1);
    expect(channel).toHaveBeenCalledWith(
      workspaceChannelName("w1"),
      expect.objectContaining({
        config: { presence: { key: "u1" } },
      }),
    );

    await manager.stop();
  });

  it("preserves authoritative self presence before sync", async () => {
    const { RealtimeManager } = await import(
      "@/lib/demos/taskflow/realtime/RealtimeManager"
    );
    const manager = new RealtimeManager();
    await manager.start("w1", "u1", {
      userId: "u1",
      displayName: "Ada Lovelace",
      avatarUrl: "https://example.com/a.png",
      workspaceId: "w1",
      currentView: "tasks",
      currentEntityId: null,
    });

    await manager.updatePresence({ currentEntityId: "task-9" });
    const self = manager.getSelfPayload();
    expect(self?.displayName).toBe("Ada Lovelace");
    expect(self?.avatarUrl).toBe("https://example.com/a.png");
    expect(self?.currentEntityId).toBe("task-9");
    expect(self?.displayName).not.toBe("User");

    await manager.stop();
  });

  it("exposes bounded reconnect backoff helpers", async () => {
    const { RealtimeManager } = await import(
      "@/lib/demos/taskflow/realtime/RealtimeManager"
    );
    expect(RealtimeManager.backoffDelayMs(0)).toBe(1000);
    expect(RealtimeManager.backoffDelayMs(99)).toBe(30_000);
  });
});
