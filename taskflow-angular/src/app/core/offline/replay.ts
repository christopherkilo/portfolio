import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  TaskflowApiError,
  unwrapTaskflowEnvelope,
} from "../api/envelope";
import { catchTaskflowHttp, isStaleVersionError } from "../api/http-rx";
import { AuthService } from "../auth/auth";
import { ActivityDataService } from "../data/activity-data";
import { MembersDataService } from "../data/members-data";
import { TasksDataService } from "../data/tasks-data";
import { NetworkStatusService } from "../realtime/network-status";
import { RealtimeService } from "../realtime/realtime";
import { REPLAY_LOCK_NAME } from "./db";
import { MutationQueueService } from "./mutation-queue";
import { isTransportFailure } from "./transport";
import type { QueuedMutation } from "./queued-mutation";

/**
 * One replay owner per Angular instance. Sequential, oldest-first.
 */
@Injectable({ providedIn: "root" })
export class OfflineReplayService {
  private readonly http = inject(HttpClient);
  private readonly queue = inject(MutationQueueService);
  private readonly auth = inject(AuthService);
  private readonly network = inject(NetworkStatusService);
  private readonly realtime = inject(RealtimeService);
  private readonly tasks = inject(TasksDataService);
  private readonly activity = inject(ActivityDataService);
  private readonly members = inject(MembersDataService);
  private readonly document = inject(DOCUMENT);

  private inFlight = false;

  constructor() {
    this.realtime.reconnects$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        void this.tryReplay();
      });
  }

  /**
   * Called from the shell effect (untracked). Auth checking must not replay.
   */
  async tryReplay(): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    const user = this.auth.currentUser();
    if (!user) return;
    if (this.network.online() === false) return;
    if (this.inFlight) return;
    this.inFlight = true;
    try {
      await this.queue.whenReady();
      const locks = this.document.defaultView?.navigator?.locks;
      if (locks?.request) {
        await locks.request(REPLAY_LOCK_NAME, { mode: "exclusive" }, () =>
          this.drain(user.id),
        );
        return;
      }
      await this.drain(user.id);
    } finally {
      this.inFlight = false;
    }
  }

  private async drain(userId: string): Promise<void> {
    const pending = this.queue.replayableForUser(userId);
    for (const item of pending) {
      if (item.userId !== userId) return;
      try {
        await this.send(item);
        await this.queue.remove(item.id);
        this.reloadAfterSuccess();
      } catch (error) {
        const stopped = await this.onFailure(item, error);
        if (stopped) return;
      }
    }
  }

  private async send(item: QueuedMutation): Promise<void> {
    if (item.type !== "task_update" && item.type !== "task_status") {
      throw new Error(`Unsupported queued type ${item.type}`);
    }
    const body = {
      ...item.payload,
      expectedVersion: item.expectedVersion,
    };
    await firstValueFrom(
      this.http
        .patch<ApiSuccess<unknown> | ApiFailure>(
          `/api/tasks/${item.entityId}`,
          body,
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
  }

  private async onFailure(
    item: QueuedMutation,
    error: unknown,
  ): Promise<boolean> {
    if (isStaleVersionError(error)) {
      await this.queue.update(item.id, {
        status: "conflict",
        errorMessage: error.message,
        retryCount: item.retryCount + 1,
        latest: error.data?.latest,
      });
      this.reloadAfterSuccess();
      return true;
    }

    if (error instanceof TaskflowApiError && error.status === 401) {
      return true;
    }

    if (isTransportFailure(error)) {
      return true;
    }

    if (error instanceof TaskflowApiError && error.status === 403) {
      await this.queue.update(item.id, {
        status: "failed",
        errorMessage: error.message,
        retryCount: item.retryCount + 1,
      });
      this.members.reload();
      return true;
    }

    await this.queue.update(item.id, {
      status: "failed",
      errorMessage:
        error instanceof Error ? error.message : "Replay failed",
      retryCount: item.retryCount + 1,
    });
    return true;
  }

  private reloadAfterSuccess(): void {
    this.tasks.reload();
    this.activity.reload();
  }
}
