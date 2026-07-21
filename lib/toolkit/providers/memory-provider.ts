import type { MemorySnapshot } from "@/lib/toolkit/types";

export interface MemoryDataProvider {
  getSnapshot(): Promise<MemorySnapshot>;
}
