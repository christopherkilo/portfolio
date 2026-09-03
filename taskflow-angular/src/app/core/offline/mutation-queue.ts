import { DOCUMENT } from "@angular/common";
import { Injectable, computed, inject, signal } from "@angular/core";
import {
  type EnqueueMutationInput,
  type OfflineQueueCounts,
  type QueuedMutation,
  computeOfflineQueueCounts,
  sortQueuedMutations,
} from "./queued-mutation";
import { isAngularQueueable } from "./policy";
import {
  type OfflineQueueBackend,
  openAngularOfflineBackend,
} from "./queue-backend";
import { assertSafeQueuePayload } from "./transport";

/**
 * Durable outbox. Does not own Task[] / Project[] / Member[].
 */
@Injectable({ providedIn: "root" })
export class MutationQueueService {
  private readonly document = inject(DOCUMENT);
  private backend: OfflineQueueBackend | null = null;
  private readonly ready: Promise<void>;
  private readonly items = signal<QueuedMutation[]>([]);

  readonly counts = computed(() => computeOfflineQueueCounts(this.items()));
  readonly pendingCount = computed(() => this.counts().pending);
  readonly failedCount = computed(() => this.counts().failed);
  readonly conflictedCount = computed(() => this.counts().conflicted);
  readonly hasPendingChanges = computed(() => this.pendingCount() > 0);
  readonly needsAttention = computed(
    () => this.counts().totalNeedsAttention > 0,
  );

  constructor() {
    this.ready = this.hydrate();
  }

  whenReady(): Promise<void> {
    return this.ready;
  }

  list(): QueuedMutation[] {
    return this.items();
  }

  listForUser(userId: string): QueuedMutation[] {
    return this.items().filter((item) => item.userId === userId);
  }

  replayableForUser(userId: string): QueuedMutation[] {
    return sortQueuedMutations(
      this.listForUser(userId).filter(
        (item) => item.status === "pending" || item.status === "failed",
      ),
    );
  }

  conflictedForUser(userId: string): QueuedMutation[] {
    return sortQueuedMutations(
      this.listForUser(userId).filter((item) => item.status === "conflict"),
    );
  }

  async enqueue(input: EnqueueMutationInput): Promise<QueuedMutation> {
    if (!isAngularQueueable(input.type)) {
      throw new Error(`Mutation type ${input.type} cannot be queued.`);
    }
    if (!input.userId) {
      throw new Error("Queued mutations require a user id.");
    }
    const item: QueuedMutation = {
      type: input.type,
      userId: input.userId,
      workspaceId: input.workspaceId,
      entityId: input.entityId,
      payload: assertSafeQueuePayload(input.payload),
      expectedVersion: input.expectedVersion,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: "pending",
    };
    await this.store().then((backend) => backend.put(item));
    await this.refresh();
    return item;
  }

  async update(
    id: string,
    patch: Partial<QueuedMutation>,
  ): Promise<void> {
    const current = this.items().find((item) => item.id === id);
    if (!current) return;
    const next = { ...current, ...patch, id: current.id };
    await this.store().then((backend) => backend.put(next));
    await this.refresh();
  }

  async remove(id: string): Promise<void> {
    await this.store().then((backend) => backend.delete(id));
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const backend = await this.store();
    this.items.set(await backend.list());
  }

  snapshotCounts(): OfflineQueueCounts {
    return this.counts();
  }

  private async hydrate(): Promise<void> {
    await this.refresh();
  }

  private async store(): Promise<OfflineQueueBackend> {
    if (this.backend) return this.backend;
    const idb = this.document.defaultView?.indexedDB;
    this.backend = await openAngularOfflineBackend(idb);
    return this.backend;
  }
}
