"use client";

/**
 * Client-only offline mutation outbox.
 * IndexedDB preferred; falls back to memory if IDB unavailable.
 */

export type QueuedMutationType =
  | "task_update"
  | "task_status"
  | "comment_create"
  | "notification_read";

export type QueuedMutation = {
  id: string;
  type: QueuedMutationType;
  entityId: string;
  workspaceId: string;
  payload: Record<string, unknown>;
  expectedVersion?: number;
  createdAt: string;
  retryCount: number;
  status: "pending" | "failed" | "conflict";
  errorMessage?: string;
};

export type OfflineQueueCounts = {
  pending: number;
  failed: number;
  conflicted: number;
  totalNeedsAttention: number;
};

export const UNSAFE_OFFLINE_ACTIONS = new Set([
  "member_role",
  "member_remove",
  "invitation_accept",
  "invitation_create",
  "attachment_delete",
  "destructive_delete",
  "ownership_change",
]);

export function isSafeOfflineMutation(type: QueuedMutationType) {
  return (
    type === "task_update" ||
    type === "task_status" ||
    type === "comment_create" ||
    type === "notification_read"
  );
}

export function computeOfflineQueueCounts(
  items: QueuedMutation[],
): OfflineQueueCounts {
  const pending = items.filter((i) => i.status === "pending").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const conflicted = items.filter((i) => i.status === "conflict").length;
  return {
    pending,
    failed,
    conflicted,
    totalNeedsAttention: failed + conflicted,
  };
}

const DB_NAME = "taskflow-offline-v1";
const STORE = "mutations";

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

let memoryQueue: QueuedMutation[] = [];

export async function listQueuedMutations(): Promise<QueuedMutation[]> {
  const db = await openDb();
  if (!db) return [...memoryQueue];
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as QueuedMutation[]) ?? []);
    req.onerror = () => resolve([...memoryQueue]);
  });
}

export async function enqueueMutation(
  input: Omit<QueuedMutation, "id" | "createdAt" | "retryCount" | "status">,
): Promise<QueuedMutation> {
  const item: QueuedMutation = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: "pending",
  };
  const db = await openDb();
  if (!db) {
    memoryQueue = [...memoryQueue, item];
    return item;
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return item;
}

export async function updateQueuedMutation(
  id: string,
  patch: Partial<QueuedMutation>,
): Promise<void> {
  const db = await openDb();
  if (!db) {
    memoryQueue = memoryQueue.map((m) => (m.id === id ? { ...m, ...patch } : m));
    return;
  }
  const all = await listQueuedMutations();
  const current = all.find((m) => m.id === id);
  if (!current) return;
  const next = { ...current, ...patch };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(next);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeQueuedMutation(id: string): Promise<void> {
  const db = await openDb();
  if (!db) {
    memoryQueue = memoryQueue.filter((m) => m.id !== id);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function refreshOfflineQueueCounts(
  setCounts: (counts: OfflineQueueCounts) => void,
) {
  const items = await listQueuedMutations();
  setCounts(computeOfflineQueueCounts(items));
}
