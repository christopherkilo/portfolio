import { Injectable, inject, signal, untracked } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Subject } from "rxjs";
import { TaskflowRealtimeClientFactory } from "./client-factory";
import type { RealtimeChannelLike, RealtimeClientLike } from "./client-factory";
import type { ConnectionStatus } from "./connection-status";
import {
  presenceUsersFromState,
  sanitizePresencePayload,
  type PresenceUser,
} from "./presence";
import {
  WORKSPACE_TABLES,
  workspaceChannelName,
} from "./workspace-channel";

export type RealtimeTableEvent = {
  table: string;
  payload: Record<string, unknown>;
  workspaceId: string;
};

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Workspace-scoped Realtime + Presence. Not a server-entity store.
 */
@Injectable({ providedIn: "root" })
export class RealtimeService {
  private readonly factory = inject(TaskflowRealtimeClientFactory);
  private readonly document = inject(DOCUMENT);

  private client: RealtimeClientLike | null = null;
  private channel: RealtimeChannelLike | null = null;
  private workspaceId: string | null = null;
  private userId: string | null = null;
  private selfPayload: PresenceUser | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private reconnecting = false;
  private intentionalStop = false;
  private browserOffline = false;
  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;

  readonly connectionStatus = signal<ConnectionStatus>("offline");
  readonly presenceUsers = signal<PresenceUser[]>([]);
  readonly invalidations$ = new Subject<RealtimeTableEvent>();
  readonly reconnects$ = new Subject<{ workspaceId: string }>();

  static backoffDelayMs(attempt: number) {
    const raw = INITIAL_BACKOFF_MS * 2 ** Math.max(0, attempt);
    return Math.min(MAX_BACKOFF_MS, raw);
  }

  getSelfPayload() {
    return this.selfPayload;
  }

  activeWorkspaceId() {
    return this.workspaceId;
  }

  hasChannel() {
    return this.channel !== null;
  }

  async start(
    workspaceId: string,
    userId: string,
    self: Omit<PresenceUser, "lastActiveAt">,
  ) {
    const status = untracked(() => this.connectionStatus());
    if (
      this.workspaceId === workspaceId &&
      this.userId === userId &&
      (status === "online" ||
        status === "connected" ||
        status === "connecting" ||
        status === "reconnecting")
    ) {
      return;
    }

    this.intentionalStop = false;
    await this.stop({ asRestart: true });
    this.intentionalStop = false;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.selfPayload = sanitizePresencePayload({
      ...self,
      lastActiveAt: new Date().toISOString(),
    });
    this.reconnectAttempt = 0;
    this.setStatus("connecting");
    this.bindBrowserNetwork();

    try {
      this.client = this.client ?? (await this.factory.create());
    } catch {
      this.setStatus("offline");
      return;
    }

    await this.subscribeChannel(workspaceId, userId, this.selfPayload!);
  }

  async updatePresence(patch: Partial<PresenceUser>) {
    if (!this.selfPayload) return;
    const next = sanitizePresencePayload({
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
    });
    if (!next) return;
    this.selfPayload = next;
    if (!this.channel) return;
    await this.channel.track(this.selfPayload);
  }

  async stop(options?: { asRestart?: boolean }) {
    this.intentionalStop = !options?.asRestart;
    this.clearReconnectTimer();
    this.reconnecting = false;
    this.reconnectAttempt = 0;
    if (!options?.asRestart) {
      this.unbindBrowserNetwork();
    }
    if (this.channel && this.client) {
      await this.client.removeChannel(this.channel);
    }
    this.channel = null;
    this.workspaceId = null;
    this.userId = null;
    if (!options?.asRestart) {
      this.client = null;
      this.selfPayload = null;
    }
    this.clearPresenceUsers();
    if (!options?.asRestart) {
      this.setStatus("offline");
    }
  }

  private clearPresenceUsers() {
    untracked(() => {
      if (this.presenceUsers().length === 0) return;
      this.presenceUsers.set([]);
    });
  }

  notifyBrowserOffline() {
    this.browserOffline = true;
    this.setStatus("offline");
    this.clearReconnectTimer();
    this.reconnecting = false;
  }

  notifyBrowserOnline() {
    this.browserOffline = false;
    if (this.intentionalStop) return;
    this.reconnectAttempt = 0;
    this.scheduleReconnect();
  }

  private setStatus(next: ConnectionStatus) {
    this.connectionStatus.set(next === "connected" ? "online" : next);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect() {
    if (
      this.intentionalStop ||
      this.browserOffline ||
      !this.workspaceId ||
      !this.userId ||
      !this.selfPayload
    ) {
      return;
    }
    if (this.reconnecting) return;
    this.reconnecting = true;
    this.setStatus("reconnecting");
    const delay = RealtimeService.backoffDelayMs(this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnecting = false;
      void this.reconnectNow();
    }, delay);
  }

  private async reconnectNow() {
    if (
      this.intentionalStop ||
      this.browserOffline ||
      !this.workspaceId ||
      !this.userId ||
      !this.selfPayload
    ) {
      return;
    }
    const workspaceId = this.workspaceId;
    const userId = this.userId;
    const self = { ...this.selfPayload };
    try {
      await this.subscribeChannel(workspaceId, userId, self);
      this.reconnectAttempt = 0;
      this.reconnects$.next({ workspaceId });
    } catch {
      this.setStatus("failed");
      this.scheduleReconnect();
    }
  }

  private async subscribeChannel(
    workspaceId: string,
    userId: string,
    self: PresenceUser,
  ) {
    if (!this.client) {
      this.client = await this.factory.create();
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
    const subscribed = this.channel;

    for (const table of tables) {
      this.channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: { new?: unknown; old?: unknown }) => {
          if (this.channel !== subscribed) return;
          if (this.workspaceId !== workspaceId) return;
          this.invalidations$.next({
            table,
            payload: (payload.new ?? payload.old ?? {}) as Record<
              string,
              unknown
            >,
            workspaceId,
          });
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
      (payload: { new?: unknown; old?: unknown }) => {
        if (this.channel !== subscribed) return;
        if (this.userId !== userId) return;
        this.invalidations$.next({
          table: "notifications",
          payload: (payload.new ?? payload.old ?? {}) as Record<string, unknown>,
          workspaceId,
        });
      },
    );

    this.channel.on("presence", { event: "sync" }, () => {
      if (this.channel !== subscribed) return;
      const users = presenceUsersFromState(this.channel?.presenceState() ?? {});
      this.presenceUsers.set(users);
    });

    await new Promise<void>((resolve, reject) => {
      if (!this.channel) {
        reject(new Error("channel missing"));
        return;
      }
      this.channel.subscribe(async (status) => {
        if (this.channel !== subscribed) return;
        if (status === "SUBSCRIBED") {
          this.setStatus("online");
          const payload = sanitizePresencePayload({
            ...(this.selfPayload ?? self),
            lastActiveAt: new Date().toISOString(),
          });
          if (payload) {
            this.selfPayload = payload;
            await this.channel?.track(payload);
          }
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

  private bindBrowserNetwork() {
    const win = this.document.defaultView;
    if (!win || this.onlineListener) return;
    this.offlineListener = () => this.notifyBrowserOffline();
    this.onlineListener = () => this.notifyBrowserOnline();
    win.addEventListener("offline", this.offlineListener);
    win.addEventListener("online", this.onlineListener);
  }

  private unbindBrowserNetwork() {
    const win = this.document.defaultView;
    if (!win) return;
    if (this.offlineListener) {
      win.removeEventListener("offline", this.offlineListener);
    }
    if (this.onlineListener) {
      win.removeEventListener("online", this.onlineListener);
    }
    this.onlineListener = null;
    this.offlineListener = null;
  }
}
