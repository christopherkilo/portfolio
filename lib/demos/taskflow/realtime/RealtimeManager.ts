"use client";

import {
  WORKSPACE_TABLES,
  workspaceChannelName,
} from "@/lib/demos/taskflow/realtime/workspaceChannel";
import { createTaskflowBrowserClient } from "@/lib/demos/taskflow/supabase/browser";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "online"
  | "reconnecting"
  | "offline"
  | "failed";

export type PresenceUser = {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  workspaceId: string;
  currentView?: string;
  currentEntityId?: string | null;
  lastActiveAt: string;
};

type InvalidateFn = (table: string, payload: Record<string, unknown>) => void;

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Coordinates workspace-scoped Realtime channels.
 * Not a second app store — only presence + connection + invalidate callbacks.
 */
export class RealtimeManager {
  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private workspaceId: string | null = null;
  private userId: string | null = null;
  private selfPayload: PresenceUser | null = null;
  private status: ConnectionStatus = "offline";
  private presence: PresenceUser[] = [];
  private onInvalidate: InvalidateFn | null = null;
  private onPresence: ((users: PresenceUser[]) => void) | null = null;
  private onStatus: ((status: ConnectionStatus) => void) | null = null;
  private onReconnectSuccess: (() => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private reconnecting = false;
  private intentionalStop = false;

  setHandlers(handlers: {
    onInvalidate?: InvalidateFn;
    onPresence?: (users: PresenceUser[]) => void;
    onStatus?: (status: ConnectionStatus) => void;
    onReconnectSuccess?: () => void;
  }) {
    this.onInvalidate = handlers.onInvalidate ?? null;
    this.onPresence = handlers.onPresence ?? null;
    this.onStatus = handlers.onStatus ?? null;
    this.onReconnectSuccess = handlers.onReconnectSuccess ?? null;
  }

  getStatus() {
    return this.status;
  }

  getPresence() {
    return this.presence;
  }

  getSelfPayload() {
    return this.selfPayload;
  }

  /** Test helper — next backoff delay for attempt index (0-based). */
  static backoffDelayMs(attempt: number) {
    const raw = INITIAL_BACKOFF_MS * 2 ** Math.max(0, attempt);
    return Math.min(MAX_BACKOFF_MS, raw);
  }

  private setStatus(next: ConnectionStatus) {
    this.status = next;
    this.onStatus?.(next === "connected" ? "online" : next);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.intentionalStop || !this.workspaceId || !this.userId || !this.selfPayload) {
      return;
    }
    if (this.reconnecting) return;
    this.reconnecting = true;
    this.setStatus("reconnecting");
    const delay = RealtimeManager.backoffDelayMs(this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnecting = false;
      void this.reconnectNow();
    }, delay);
  }

  private async reconnectNow() {
    if (this.intentionalStop || !this.workspaceId || !this.userId || !this.selfPayload) {
      return;
    }
    const workspaceId = this.workspaceId;
    const userId = this.userId;
    const self = { ...this.selfPayload };
    try {
      await this.subscribeChannel(workspaceId, userId, self);
      this.reconnectAttempt = 0;
      this.onReconnectSuccess?.();
    } catch {
      this.setStatus("failed");
      this.scheduleReconnect();
    }
  }

  async start(
    workspaceId: string,
    userId: string,
    self: Omit<PresenceUser, "lastActiveAt">,
  ) {
    if (
      this.workspaceId === workspaceId &&
      this.userId === userId &&
      this.channel &&
      (this.status === "online" || this.status === "connected")
    ) {
      return;
    }

    this.intentionalStop = false;
    await this.stop({ preserveSelf: false, asRestart: true });
    this.intentionalStop = false;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.selfPayload = {
      ...self,
      lastActiveAt: new Date().toISOString(),
    };
    this.reconnectAttempt = 0;
    this.setStatus("connecting");

    try {
      this.client = createTaskflowBrowserClient();
    } catch {
      this.setStatus("offline");
      return;
    }

    await this.subscribeChannel(workspaceId, userId, this.selfPayload);
  }

  private async subscribeChannel(
    workspaceId: string,
    userId: string,
    self: PresenceUser,
  ) {
    if (!this.client) {
      this.client = createTaskflowBrowserClient();
    }

    if (this.channel) {
      await this.client.removeChannel(this.channel);
      this.channel = null;
    }

    const channelName = workspaceChannelName(workspaceId);
    this.channel = this.client.channel(channelName, {
      config: { presence: { key: userId } },
    });

    const tables = WORKSPACE_TABLES.filter((table) => table !== "notifications");

    for (const table of tables) {
      this.channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          this.onInvalidate?.(
            table,
            (payload.new ?? payload.old ?? {}) as Record<string, unknown>,
          );
        },
      );
    }

    this.channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        this.onInvalidate?.(
          "notifications",
          (payload.new ?? payload.old ?? {}) as Record<string, unknown>,
        );
      },
    );

    this.channel.on("presence", { event: "sync" }, () => {
      const state = this.channel?.presenceState() ?? {};
      const users: PresenceUser[] = [];
      for (const key of Object.keys(state)) {
        const metas = state[key] as unknown as PresenceUser[] | undefined;
        if (metas?.[0]?.userId) users.push(metas[0]);
      }
      this.presence = users;
      this.onPresence?.(users);
    });

    await new Promise<void>((resolve, reject) => {
      if (!this.channel) {
        reject(new Error("channel missing"));
        return;
      }
      this.channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          this.setStatus("online");
          const payload = {
            ...(this.selfPayload ?? self),
            lastActiveAt: new Date().toISOString(),
          };
          this.selfPayload = payload;
          await this.channel?.track(payload);
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          this.setStatus("reconnecting");
          this.scheduleReconnect();
          reject(new Error(status));
        } else if (status === "CLOSED") {
          if (!this.intentionalStop) {
            this.setStatus("offline");
            this.scheduleReconnect();
          }
        }
      });
    }).catch(() => {
      /* reconnect scheduled */
    });
  }

  notifyBrowserOffline() {
    this.setStatus("offline");
    this.clearReconnectTimer();
    this.reconnecting = false;
  }

  notifyBrowserOnline() {
    if (this.intentionalStop) return;
    this.reconnectAttempt = 0;
    this.scheduleReconnect();
  }

  async updatePresence(patch: Partial<PresenceUser>) {
    if (!this.selfPayload) return;
    this.selfPayload = {
      ...this.selfPayload,
      ...patch,
      userId: this.selfPayload.userId,
      displayName: patch.displayName ?? this.selfPayload.displayName,
      avatarUrl:
        patch.avatarUrl !== undefined
          ? patch.avatarUrl
          : this.selfPayload.avatarUrl,
      workspaceId: this.selfPayload.workspaceId,
      lastActiveAt: new Date().toISOString(),
    };
    if (!this.channel) return;
    await this.channel.track(this.selfPayload);
  }

  async stop(options?: { preserveSelf?: boolean; asRestart?: boolean }) {
    this.intentionalStop = !options?.asRestart;
    this.clearReconnectTimer();
    this.reconnecting = false;
    this.reconnectAttempt = 0;
    if (this.channel && this.client) {
      await this.client.removeChannel(this.channel);
    }
    this.channel = null;
    this.workspaceId = null;
    this.userId = null;
    if (!options?.preserveSelf) {
      this.selfPayload = null;
    }
    this.presence = [];
    this.onPresence?.([]);
    if (!options?.asRestart) {
      this.setStatus("offline");
    }
  }
}

export const taskflowRealtimeManager = new RealtimeManager();
