import type { Recommendation } from "@/lib/toolkit/types";

/** Deterministic mulberry32 PRNG — stable, non-chaotic simulation. */
export function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Gentle drift toward a nearby value within [min, max]. */
export function smoothDrift(
  value: number,
  min: number,
  max: number,
  amount: number,
  random: () => number = Math.random,
) {
  const delta = (random() - 0.48) * amount;
  const next = value + delta;
  return Math.round(Math.min(max, Math.max(min, next)) * 10) / 10;
}

export function buildSparkline(
  length: number,
  baseline: number,
  spread: number,
  seed: number,
) {
  const random = createRng(seed);
  let value = baseline;
  return Array.from({ length }, () => {
    value = smoothDrift(value, baseline - spread, baseline + spread, spread * 0.4, random);
    return value;
  });
}

export const DIAGNOSTIC_SCAN_STAGES = [
  "Running diagnostics…",
  "Checking memory…",
  "Scanning network…",
  "Reading storage…",
  "Complete.",
] as const;

export const STARTUP_STAGES = [
  "Initializing Toolkit…",
  "Loading modules…",
  "Running diagnostics…",
  "Ready.",
] as const;

export const RECOMMENDATION_POOL: Recommendation[] = [
  {
    id: "browser-cache",
    title: "Clear browser cache",
    reason: "Browser cache exceeds the recommended working size for this session profile.",
    benefit: "Clearing cached files may improve browser responsiveness and free storage space.",
    description: "Clear browser cache to reclaim space and responsiveness.",
    priority: "medium",
    module: "memory",
  },
  {
    id: "storage-headroom",
    title: "Recover primary-drive headroom",
    reason: "System drive utilization is above 70%, leaving limited room for updates and temp files.",
    benefit: "Freeing 10–15% capacity reduces update failures and improves write performance.",
    description: "Review large files before utilization reaches 85%.",
    priority: "medium",
    module: "system",
  },
  {
    id: "browser-tabs",
    title: "Review browser workload",
    reason: "The browser is the largest memory consumer in the current process sample.",
    benefit: "Closing inactive tabs often restores available RAM without hardware changes.",
    description: "Close inactive tabs before considering a memory upgrade.",
    priority: "low",
    module: "memory",
  },
  {
    id: "restart-cycle",
    title: "Schedule a normal restart",
    reason: "Extended uptime can leave pending updates and stale driver state unresolved.",
    benefit: "A clean restart completes updates and clears long-running process drift.",
    description: "Save work and restart during a quiet window.",
    priority: "low",
    module: "system",
  },
  {
    id: "startup-apps",
    title: "Trim startup applications",
    reason: "Utility launchers are loading at login and contributing to early memory pressure.",
    benefit: "Fewer startup apps shorten boot time and keep more RAM available for active work.",
    description: "Disable unused launchers from startup.",
    priority: "medium",
    module: "memory",
  },
  {
    id: "dns-check",
    title: "Compare DNS resolvers",
    reason: "Latency variance between resolvers suggests a faster public DNS may help.",
    benefit: "A lower DNS response time can improve page start times on cold lookups.",
    description: "Test Cloudflare or Quad9 alongside ISP DNS.",
    priority: "low",
    module: "network",
  },
  {
    id: "cable-check",
    title: "Verify Ethernet link integrity",
    reason: "Occasional jitter spikes appear in the connection-quality trend.",
    benefit: "Confirming cable and switch ports prevents intermittent call quality issues.",
    description: "Reseat cable and retest during peak hours.",
    priority: "low",
    module: "network",
  },
  {
    id: "temp-cleanup",
    title: "Clear safe temporary files",
    reason: "Development caches and installer leftovers are accumulating on the system volume.",
    benefit: "Safe cleanup often recovers several gigabytes without touching project files.",
    description: "Use Disk Cleanup or equivalent for temporary folders.",
    priority: "high",
    module: "system",
  },
];

export function pickRecommendations(seed: number, count = 3): Recommendation[] {
  const random = createRng(seed);
  const pool = [...RECOMMENDATION_POOL];
  const selected: Recommendation[] = [];
  while (selected.length < count && pool.length) {
    const index = Math.floor(random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
}

export function scoreLabel(score: number): "Healthy" | "Optimized" | "Monitoring" | "Attention" | "Minor Warning" {
  if (score >= 93) return "Optimized";
  if (score >= 88) return "Healthy";
  if (score >= 82) return "Monitoring";
  if (score >= 75) return "Attention";
  return "Minor Warning";
}

export function statusFromScore(score: number): "healthy" | "attention" | "critical" {
  if (score >= 82) return "healthy";
  if (score >= 70) return "attention";
  return "critical";
}
