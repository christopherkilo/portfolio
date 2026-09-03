import { vi } from "vitest";
import type {
  RealtimeChannelLike,
  RealtimeClientLike,
} from "../core/realtime/client-factory";
import type { PresenceUser } from "../core/realtime/presence";

export class FakeRealtimeChannel implements RealtimeChannelLike {
  readonly postgres = new Map<string, (payload: unknown) => void>();
  presenceSync: (() => void) | null = null;
  subscribeCb: ((status: string) => void | Promise<void>) | null = null;
  tracked: PresenceUser[] = [];
  state: Record<string, unknown> = {};
  name = "";
  opts: unknown = null;
  removed = false;

  on = vi.fn((...args: unknown[]) => {
    const event = args[0];
    const filter = args[1] as { table?: string; event?: string };
    const cb = args[2] as ((payload?: unknown) => void) | undefined;
    if (event === "postgres_changes" && filter?.table && cb) {
      this.postgres.set(filter.table, cb);
    }
    if (event === "presence" && cb) {
      this.presenceSync = cb as () => void;
    }
    return this;
  });

  subscribe = vi.fn((cb: (status: string) => void | Promise<void>) => {
    this.subscribeCb = cb;
    void cb("SUBSCRIBED");
    return this;
  });

  track = vi.fn(async (payload: PresenceUser) => {
    this.tracked.push(payload);
    return "ok";
  });

  presenceState = vi.fn(() => this.state);

  emitPostgres(table: string, payload: unknown) {
    this.postgres.get(table)?.(payload);
  }

  emitPresence(state: Record<string, unknown>) {
    this.state = state;
    this.presenceSync?.();
  }
}

export function createFakeRealtimeClient() {
  const channels: FakeRealtimeChannel[] = [];
  const removeChannel = vi.fn(async (channel: RealtimeChannelLike) => {
    (channel as FakeRealtimeChannel).removed = true;
  });
  const channel = vi.fn((name: string, opts: unknown) => {
    const next = new FakeRealtimeChannel();
    next.name = name;
    next.opts = opts;
    channels.push(next);
    return next;
  });
  const client: RealtimeClientLike = { channel, removeChannel };
  return {
    client,
    channel,
    removeChannel,
    channels,
    latest: () => channels[channels.length - 1] ?? null,
  };
}
