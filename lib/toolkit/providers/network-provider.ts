import type { NetworkSnapshot } from "@/lib/toolkit/types";

export interface NetworkDataProvider {
  getSnapshot(): Promise<NetworkSnapshot>;
  runConnectionTest(): Promise<NetworkSnapshot["quality"]>;
}
