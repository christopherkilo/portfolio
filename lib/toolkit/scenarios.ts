import type {
  MemorySnapshot,
  NetworkSnapshot,
  ProcessRecord,
  Recommendation,
  SystemSnapshot,
} from "@/lib/toolkit/types";
import { createRng, hashSeed, smoothDrift } from "@/lib/toolkit/simulation";

export type SimulationProfileId =
  | "healthy"
  | "heavy-memory"
  | "network-instability"
  | "low-disk"
  | "developer"
  | "aging"
  | "custom";

export type MetricRange = { min: number; max: number };

export type CustomScenarioControls = {
  cpu: number;
  memory: number;
  disk: number;
  latency: number;
  healthScore: number;
};

export type SimulationProfile = {
  id: SimulationProfileId;
  label: string;
  description: string;
  cpu: MetricRange;
  memory: MetricRange;
  disk: MetricRange;
  gpu: MetricRange;
  networkThroughput: MetricRange;
  latency: MetricRange;
  packetLoss: MetricRange;
  health: MetricRange;
  recommendations: Recommendation[];
};

export const DEFAULT_CUSTOM_CONTROLS: CustomScenarioControls = {
  cpu: 22,
  memory: 58,
  disk: 48,
  latency: 18,
  healthScore: 92,
};

const mid = (range: MetricRange) => (range.min + range.max) / 2;

export const SIMULATION_PROFILES: Record<Exclude<SimulationProfileId, "custom">, SimulationProfile> = {
  healthy: {
    id: "healthy",
    label: "Healthy System",
    description: "Balanced load with stable connectivity and comfortable headroom.",
    cpu: { min: 15, max: 30 },
    memory: { min: 45, max: 65 },
    disk: { min: 40, max: 60 },
    gpu: { min: 8, max: 24 },
    networkThroughput: { min: 4, max: 16 },
    latency: { min: 15, max: 25 },
    packetLoss: { min: 0, max: 0.2 },
    health: { min: 90, max: 95 },
    recommendations: [
      {
        id: "healthy-maintenance",
        title: "Keep routine updates current",
        reason: "The workstation is stable; preventive maintenance is still worthwhile.",
        benefit: "Staying current reduces surprise restart prompts during busy work.",
        description: "Install pending OS updates during a quiet window.",
        priority: "low",
        module: "system",
      },
    ],
  },
  "heavy-memory": {
    id: "heavy-memory",
    label: "Heavy Memory Usage",
    description: "Elevated RAM pressure from browsers and background utilities.",
    cpu: { min: 25, max: 40 },
    memory: { min: 85, max: 95 },
    disk: { min: 35, max: 55 },
    gpu: { min: 10, max: 28 },
    networkThroughput: { min: 3, max: 14 },
    latency: { min: 16, max: 28 },
    packetLoss: { min: 0, max: 0.3 },
    health: { min: 74, max: 81 },
    recommendations: [
      {
        id: "close-unused-apps",
        title: "Close unused applications",
        reason: "Several background apps remain open while memory utilization is above 85%.",
        benefit: "Freeing idle processes can restore several gigabytes of available RAM quickly.",
        description: "Close unused applications to relieve memory pressure.",
        priority: "high",
        module: "memory",
      },
      {
        id: "restart-memory-apps",
        title: "Restart memory-intensive software",
        reason: "Long-running browsers and editors often retain caches that grow over a session.",
        benefit: "A clean restart usually returns those apps to a lighter working set.",
        description: "Restart memory-intensive software.",
        priority: "medium",
        module: "memory",
      },
      {
        id: "review-startup",
        title: "Review startup programs",
        reason: "Startup utilities are contributing to baseline memory use after login.",
        benefit: "Trimming startup entries keeps more RAM free for active work.",
        description: "Review and disable unused startup programs.",
        priority: "medium",
        module: "memory",
      },
    ],
  },
  "network-instability": {
    id: "network-instability",
    label: "Network Instability",
    description: "Elevated latency, packet loss, and slower DNS responses.",
    cpu: { min: 12, max: 28 },
    memory: { min: 48, max: 64 },
    disk: { min: 38, max: 55 },
    gpu: { min: 6, max: 20 },
    networkThroughput: { min: 2, max: 10 },
    latency: { min: 80, max: 180 },
    packetLoss: { min: 1, max: 5 },
    health: { min: 82, max: 87 },
    recommendations: [
      {
        id: "restart-router",
        title: "Restart router",
        reason: "Latency and packet loss suggest the gateway may need a clean restart.",
        benefit: "A router reboot often clears transient congestion and stale NAT state.",
        description: "Power-cycle the router, then retest.",
        priority: "high",
        module: "network",
      },
      {
        id: "use-wired",
        title: "Use a wired connection",
        reason: "Wireless interference can amplify jitter during unstable periods.",
        benefit: "Ethernet typically restores lower latency for calls and remote work.",
        description: "Prefer a wired connection while troubleshooting.",
        priority: "medium",
        module: "network",
      },
      {
        id: "check-signal",
        title: "Check signal quality",
        reason: "DNS responses are slow and packet loss is elevated.",
        benefit: "Confirming signal and channel quality isolates local RF issues quickly.",
        description: "Check Wi-Fi signal quality and channel congestion.",
        priority: "medium",
        module: "network",
      },
    ],
  },
  "low-disk": {
    id: "low-disk",
    label: "Low Disk Space",
    description: "Primary volume is nearly full with limited room for updates.",
    cpu: { min: 14, max: 28 },
    memory: { min: 48, max: 62 },
    disk: { min: 55, max: 75 },
    gpu: { min: 8, max: 22 },
    networkThroughput: { min: 3, max: 12 },
    latency: { min: 15, max: 26 },
    packetLoss: { min: 0, max: 0.2 },
    health: { min: 74, max: 80 },
    recommendations: [
      {
        id: "delete-temp",
        title: "Delete temporary files",
        reason: "System drive utilization is above 90%, leaving little room for updates.",
        benefit: "Clearing temp folders often recovers several gigabytes safely.",
        description: "Delete temporary files and installer leftovers.",
        priority: "high",
        module: "system",
      },
      {
        id: "move-large-files",
        title: "Move large files",
        reason: "Media and archives are consuming primary-drive capacity.",
        benefit: "Relocating large files restores headroom without deleting projects.",
        description: "Move large files to secondary storage.",
        priority: "medium",
        module: "system",
      },
      {
        id: "empty-recycle",
        title: "Empty recycle bin",
        reason: "Deleted items may still occupy recoverable space on the system volume.",
        benefit: "Emptying the recycle bin immediately frees previously deleted capacity.",
        description: "Empty the recycle bin.",
        priority: "medium",
        module: "system",
      },
    ],
  },
  developer: {
    id: "developer",
    label: "Developer Workstation",
    description: "Busy but healthy: IDEs, Docker, browsers, terminals, and Node processes.",
    cpu: { min: 28, max: 48 },
    memory: { min: 68, max: 82 },
    disk: { min: 45, max: 65 },
    gpu: { min: 12, max: 35 },
    networkThroughput: { min: 8, max: 28 },
    latency: { min: 14, max: 24 },
    packetLoss: { min: 0, max: 0.2 },
    health: { min: 93, max: 97 },
    recommendations: [
      {
        id: "docker-idle",
        title: "Close inactive Docker containers",
        reason: "Several containers remain running while not actively serving local work.",
        benefit: "Stopping idle containers frees RAM and CPU for active development tasks.",
        description: "Stop inactive Docker containers.",
        priority: "low",
        module: "memory",
      },
    ],
  },
  aging: {
    id: "aging",
    label: "Aging Workstation",
    description: "Elevated CPU, warmer thermals, moderate disk use, and longer startup.",
    cpu: { min: 35, max: 55 },
    memory: { min: 58, max: 72 },
    disk: { min: 55, max: 72 },
    gpu: { min: 18, max: 42 },
    networkThroughput: { min: 3, max: 12 },
    latency: { min: 20, max: 35 },
    packetLoss: { min: 0, max: 0.4 },
    health: { min: 76, max: 84 },
    recommendations: [
      {
        id: "thermal-dust",
        title: "Check cooling and dust buildup",
        reason: "CPU temperatures trend higher than expected for this workload profile.",
        benefit: "Improved airflow often lowers sustained clocks and fan noise.",
        description: "Inspect fans and intake filters.",
        priority: "medium",
        module: "system",
      },
      {
        id: "startup-delay",
        title: "Trim startup backlog",
        reason: "Estimated startup time is longer due to accumulated login tasks.",
        benefit: "Fewer startup items shorten boot and free early-session resources.",
        description: "Disable unused startup applications.",
        priority: "medium",
        module: "system",
      },
      {
        id: "storage-health-check",
        title: "Review storage health trends",
        reason: "Disk activity and fragmentation indicators suggest aging media behavior.",
        benefit: "Catching wear early reduces the risk of unexpected capacity issues.",
        description: "Review SMART/health trends and backup currency.",
        priority: "medium",
        module: "system",
      },
      {
        id: "schedule-restart",
        title: "Schedule a full restart",
        reason: "Extended uptime and elevated CPU suggest stale background services.",
        benefit: "A clean boot clears long-running process drift.",
        description: "Save work and perform a full restart.",
        priority: "medium",
        module: "system",
      },
    ],
  },
};

export const SCENARIO_OPTIONS: { id: SimulationProfileId; label: string }[] = [
  { id: "healthy", label: "Healthy System" },
  { id: "heavy-memory", label: "Heavy Memory Usage" },
  { id: "network-instability", label: "Network Instability" },
  { id: "low-disk", label: "Low Disk Space" },
  { id: "developer", label: "Developer Workstation" },
  { id: "aging", label: "Aging Workstation" },
  { id: "custom", label: "Custom" },
];

export function getProfile(
  id: SimulationProfileId,
  custom?: CustomScenarioControls,
): SimulationProfile {
  if (id !== "custom") return SIMULATION_PROFILES[id];
  const controls = custom ?? DEFAULT_CUSTOM_CONTROLS;
  return {
    id: "custom",
    label: "Custom",
    description: "Manually tuned CPU, memory, disk, latency, and health targets.",
    cpu: { min: controls.cpu - 3, max: controls.cpu + 3 },
    memory: { min: controls.memory - 3, max: controls.memory + 3 },
    disk: { min: Math.max(5, controls.disk - 4), max: Math.min(98, controls.disk + 4) },
    gpu: { min: 8, max: 30 },
    networkThroughput: { min: 3, max: 18 },
    latency: { min: Math.max(8, controls.latency - 4), max: controls.latency + 4 },
    packetLoss: { min: 0, max: controls.latency > 60 ? 2 : 0.3 },
    health: { min: controls.healthScore - 1, max: controls.healthScore + 1 },
    recommendations: [
      {
        id: "custom-review",
        title: "Review custom diagnostic targets",
        reason: "This profile uses manually set metric targets for demonstration.",
        benefit: "Adjust sliders to explore how recommendations and status respond.",
        description: "Tune custom controls on the overview.",
        priority: "low",
        module: "system",
      },
    ],
  };
}

export function sampleFromRange(range: MetricRange, random: () => number, decimals = 1) {
  const value = range.min + random() * (range.max - range.min);
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function profileMetrics(profile: SimulationProfile, seed: number): SystemSnapshot["metrics"] {
  const random = createRng(seed);
  return {
    cpu: sampleFromRange(profile.cpu, random, 1),
    memory: sampleFromRange(profile.memory, random, 1),
    disk: sampleFromRange(profile.disk, random, 1),
    gpu: sampleFromRange(profile.gpu, random, 1),
    network: sampleFromRange(profile.networkThroughput, random, 1),
  };
}

export function profileHealth(profile: SimulationProfile, seed: number) {
  return Math.round(sampleFromRange(profile.health, createRng(seed), 0));
}

export function driftWithinProfile(
  previous: SystemSnapshot["metrics"],
  profile: SimulationProfile,
  seed: number,
): SystemSnapshot["metrics"] {
  const random = createRng(seed);
  return {
    cpu: smoothDrift(previous.cpu, profile.cpu.min, profile.cpu.max, 2.2, random),
    memory: smoothDrift(previous.memory, profile.memory.min, profile.memory.max, 1.6, random),
    disk: smoothDrift(previous.disk, profile.disk.min, profile.disk.max, 2.0, random),
    gpu: smoothDrift(previous.gpu, profile.gpu.min, profile.gpu.max, 2.8, random),
    network: smoothDrift(
      previous.network,
      profile.networkThroughput.min,
      profile.networkThroughput.max,
      2.0,
      random,
    ),
  };
}

const DEVELOPER_PROCESSES: ProcessRecord[] = [
  {
    id: "vscode",
    name: "Visual Studio Code",
    category: "Development",
    memoryMb: 2840,
    percentage: 8.7,
    cpu: 9.2,
    status: "healthy",
  },
  {
    id: "jetbrains",
    name: "JetBrains IDE",
    category: "Development",
    memoryMb: 3210,
    percentage: 9.8,
    cpu: 11.4,
    status: "healthy",
  },
  {
    id: "docker",
    name: "Docker Desktop",
    category: "Development",
    memoryMb: 2460,
    percentage: 7.5,
    cpu: 6.8,
    status: "attention",
    recommendation: "Stop inactive containers to reclaim memory.",
  },
  {
    id: "chrome",
    name: "Browser",
    category: "Browser",
    memoryMb: 4120,
    percentage: 12.6,
    cpu: 8.1,
    status: "attention",
    recommendation: "Close unused tabs and extension-heavy windows.",
  },
  {
    id: "terminal",
    name: "Terminal",
    category: "Utility",
    memoryMb: 420,
    percentage: 1.3,
    cpu: 1.8,
    status: "healthy",
  },
  {
    id: "node",
    name: "Node.js",
    category: "Development",
    memoryMb: 980,
    percentage: 3.0,
    cpu: 7.4,
    status: "healthy",
  },
  {
    id: "slack",
    name: "Communication app",
    category: "Communication",
    memoryMb: 1180,
    percentage: 3.6,
    cpu: 2.1,
    status: "healthy",
  },
  {
    id: "postgres",
    name: "Local database",
    category: "Development",
    memoryMb: 760,
    percentage: 2.3,
    cpu: 3.2,
    status: "healthy",
  },
];

export function applyScenarioToSystem(
  base: SystemSnapshot,
  profile: SimulationProfile,
  metrics: SystemSnapshot["metrics"],
  health: number,
): SystemSnapshot {
  const clone = structuredClone(base);
  clone.metrics = metrics;
  clone.health = health;

  if (profile.id === "low-disk") {
    clone.drives = clone.drives.map((drive, index) => {
      if (index !== 0) return { ...drive, status: "healthy" as const };
      const usedPercent = 90 + ((hashSeed(profile.id) % 80) / 10);
      const usedGb = Math.round((drive.capacityGb * usedPercent) / 100);
      return {
        ...drive,
        usedGb,
        status: "attention" as const,
        health: Math.min(drive.health, 88),
      };
    });
    clone.findings = [
      {
        id: "low-disk-critical-space",
        title: "Primary drive free space is critically low",
        severity: "warning",
        explanation: "The system volume is above 90% utilization and may block updates.",
        causes: ["Temporary files", "Large downloads", "Project archives"],
        nextStep: "Clear temporary files and move large media off the system drive.",
      },
      ...clone.findings.filter((item) => item.id !== "storage-space"),
    ];
  }

  if (profile.id === "aging") {
    clone.uptime = "47 days, 9 hours";
    clone.hardware = clone.hardware.map((item) =>
      item.id === "cpu"
        ? { ...item, detail: "8 physical cores · package temp trending 78–86°C under load" }
        : item,
    );
  }

  if (profile.id === "healthy") {
    clone.drives = clone.drives.map((drive) => ({
      ...drive,
      usedGb: Math.round(drive.capacityGb * (drive.id === "c" ? 0.52 : 0.38)),
      status: "healthy" as const,
    }));
  }

  return clone;
}

export function applyScenarioToMemory(
  base: MemorySnapshot,
  profile: SimulationProfile,
  memoryPercent: number,
): MemorySnapshot {
  const clone = structuredClone(base);
  clone.usagePercent = Math.round(memoryPercent);
  clone.inUseGb = Math.round(((clone.installedGb * clone.usagePercent) / 100) * 10) / 10;
  clone.availableGb = Math.round((clone.installedGb - clone.inUseGb) * 10) / 10;
  clone.health =
    clone.usagePercent >= 85 ? "attention" : clone.usagePercent >= 70 ? "attention" : "healthy";

  if (profile.id === "developer") {
    clone.processes = structuredClone(DEVELOPER_PROCESSES);
  }

  if (profile.id === "heavy-memory") {
    clone.processes = clone.processes.map((process) =>
      process.category === "Browser"
        ? {
            ...process,
            memoryMb: Math.max(process.memoryMb, 8200),
            percentage: 25.1,
            cpu: Math.max(process.cpu, 14),
            status: "attention" as const,
            recommendation: "Close unused applications and restart the browser session.",
          }
        : process,
    );
  }

  return clone;
}

export function applyScenarioToNetwork(
  base: NetworkSnapshot,
  profile: SimulationProfile,
  seed: number,
): NetworkSnapshot {
  const clone = structuredClone(base);
  const random = createRng(seed);
  const latency = sampleFromRange(profile.latency, random, 0);
  const packetLoss = sampleFromRange(profile.packetLoss, random, 1);
  const score =
    profile.id === "network-instability"
      ? Math.round(sampleFromRange({ min: 62, max: 78 }, random, 0))
      : Math.round(sampleFromRange({ min: 88, max: 97 }, random, 0));

  clone.quality = {
    ...clone.quality,
    latency,
    packetLoss,
    jitter:
      profile.id === "network-instability"
        ? sampleFromRange({ min: 8, max: 22 }, random, 1)
        : sampleFromRange({ min: 1.2, max: 4.5 }, random, 1),
    download:
      profile.id === "network-instability"
        ? Math.round(sampleFromRange({ min: 80, max: 180 }, random, 0))
        : clone.quality.download,
    upload:
      profile.id === "network-instability"
        ? Math.round(sampleFromRange({ min: 12, max: 28 }, random, 0))
        : clone.quality.upload,
    score,
  };

  clone.dnsResults = clone.dnsResults.map((dns) => ({
    ...dns,
    responseMs:
      profile.id === "network-instability"
        ? Math.round(sampleFromRange({ min: 60, max: 140 }, random, 0))
        : Math.round(sampleFromRange({ min: dns.responseMs - 3, max: dns.responseMs + 4 }, random, 0)),
  }));

  if (profile.id === "network-instability") {
    clone.findings = [
      {
        id: "unstable-link",
        title: "Connection quality is unstable",
        severity: "warning",
        explanation: "Latency and packet loss are elevated for voice, video, and interactive work.",
        causes: ["Gateway congestion", "Wireless interference", "DNS delays"],
        nextStep: "Restart the router and retest on a wired connection if available.",
      },
    ];
  }

  return clone;
}

export function recommendationsForProfile(
  profile: SimulationProfile,
  customRecs?: Recommendation[],
) {
  if (profile.id === "custom" && customRecs?.length) return customRecs;
  if (profile.id === "healthy") return profile.recommendations.slice(0, 1);
  return profile.recommendations;
}

export function profileSummary(profile: SimulationProfile, health: number) {
  return `${profile.label} · health ${health}/100 · ${profile.description}`;
}

export { mid };
