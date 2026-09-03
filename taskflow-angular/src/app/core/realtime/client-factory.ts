import { HttpClient, HttpContext } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  unwrapTaskflowEnvelope,
} from "../api/envelope";
import { SKIP_AUTH_REDIRECT } from "../api/http-context";
import { catchTaskflowHttp } from "../api/http-rx";
import { assertPublicRealtimeConfig } from "./public-config";
import type { PresenceUser } from "./presence";

export type RealtimeChannelLike = {
  on: (...args: unknown[]) => RealtimeChannelLike;
  subscribe: (cb: (status: string) => void | Promise<void>) => unknown;
  track: (payload: PresenceUser) => Promise<unknown>;
  presenceState: () => Record<string, unknown>;
};

export type RealtimeClientLike = {
  channel: (
    name: string,
    opts: { config: { presence: { key: string } } },
  ) => RealtimeChannelLike;
  removeChannel: (channel: RealtimeChannelLike) => Promise<unknown>;
};

/**
 * Creates the publishable-key browser client for Realtime/Presence only.
 * Ordinary TaskFlow reads/writes stay on HttpClient → Next API.
 */
@Injectable({ providedIn: "root" })
export class TaskflowRealtimeClientFactory {
  private readonly http = inject(HttpClient);

  async loadPublicConfig(): Promise<{
    supabaseUrl: string;
    publishableKey: string;
  }> {
    return firstValueFrom(
      this.http
        .get<
          | ApiSuccess<{ supabaseUrl: string; publishableKey: string }>
          | ApiFailure
        >("/api/taskflow/public-config", {
          context: new HttpContext().set(SKIP_AUTH_REDIRECT, true),
        })
        .pipe(
          map((body) =>
            assertPublicRealtimeConfig(unwrapTaskflowEnvelope(body, 200)),
          ),
          catchTaskflowHttp(),
        ),
    );
  }

  async create(): Promise<RealtimeClientLike> {
    const config = await this.loadPublicConfig();
    const { createBrowserClient } = await import("@supabase/ssr");
    return createBrowserClient(
      config.supabaseUrl,
      config.publishableKey,
    ) as unknown as RealtimeClientLike;
  }
}
