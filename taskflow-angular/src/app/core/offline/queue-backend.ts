import {
  ANGULAR_MUTATIONS_STORE,
  ANGULAR_OFFLINE_DB_NAME,
  ANGULAR_OFFLINE_DB_VERSION,
  REACT_OFFLINE_DB_NAME,
} from "./db";
import type { QueuedMutation } from "./queued-mutation";

export interface OfflineQueueBackend {
  list(): Promise<QueuedMutation[]>;
  put(item: QueuedMutation): Promise<void>;
  delete(id: string): Promise<void>;
}

let memoryQueue: QueuedMutation[] = [];

export function resetAngularOfflineMemory(): void {
  memoryQueue = [];
}

export function memorySnapshot(): QueuedMutation[] {
  return [...memoryQueue];
}

class MemoryQueueBackend implements OfflineQueueBackend {
  async list(): Promise<QueuedMutation[]> {
    return [...memoryQueue];
  }

  async put(item: QueuedMutation): Promise<void> {
    memoryQueue = [...memoryQueue.filter((row) => row.id !== item.id), item];
  }

  async delete(id: string): Promise<void> {
    memoryQueue = memoryQueue.filter((row) => row.id !== id);
  }
}

class IndexedDbQueueBackend implements OfflineQueueBackend {
  constructor(private readonly db: IDBDatabase) {}

  async list(): Promise<QueuedMutation[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(ANGULAR_MUTATIONS_STORE, "readonly");
      const req = tx.objectStore(ANGULAR_MUTATIONS_STORE).getAll();
      req.onsuccess = () => resolve((req.result as QueuedMutation[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  }

  async put(item: QueuedMutation): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const tx = this.db.transaction(ANGULAR_MUTATIONS_STORE, "readwrite");
      tx.objectStore(ANGULAR_MUTATIONS_STORE).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(id: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const tx = this.db.transaction(ANGULAR_MUTATIONS_STORE, "readwrite");
      tx.objectStore(ANGULAR_MUTATIONS_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export async function openAngularOfflineBackend(
  indexedDB: IDBFactory | null | undefined,
): Promise<OfflineQueueBackend> {
  if (!indexedDB) return new MemoryQueueBackend();
  try {
    const db = await openAngularDb(indexedDB);
    if (!db) return new MemoryQueueBackend();
    return new IndexedDbQueueBackend(db);
  } catch {
    return new MemoryQueueBackend();
  }
}

function openAngularDb(indexedDB: IDBFactory): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(
        ANGULAR_OFFLINE_DB_NAME,
        ANGULAR_OFFLINE_DB_VERSION,
      );
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(ANGULAR_MUTATIONS_STORE)) {
          const store = db.createObjectStore(ANGULAR_MUTATIONS_STORE, {
            keyPath: "id",
          });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("userId", "userId");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function assertNeverOpensReactDb(name: string): void {
  if (name === REACT_OFFLINE_DB_NAME) {
    throw new Error("Angular must not open the React offline database.");
  }
}
