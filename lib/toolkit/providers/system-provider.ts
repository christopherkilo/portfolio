import type { SystemSnapshot } from "@/lib/toolkit/types";

export interface SystemDataProvider {
  getSnapshot(): Promise<SystemSnapshot>;
  getLiveMetrics(previous?: SystemSnapshot["metrics"]): Promise<SystemSnapshot["metrics"]>;
}
