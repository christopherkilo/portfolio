import type { SimulationProfileId } from "@/lib/toolkit/scenarios";
import type {
  MemorySnapshot,
  NetworkSnapshot,
  SystemSnapshot,
} from "@/lib/toolkit/types";
import type {
  CheckStatus,
  DiagnosticCheckDef,
  DiagnosticReading,
  GuideCondition,
  TroubleshootingStep,
  TroubleshootingWorkflow,
} from "@/lib/toolkit/guided/types";

export function deriveCpuTempC(profileId: SimulationProfileId, cpu: number): number {
  const base =
    profileId === "aging" ? 78 : profileId === "developer" ? 62 : profileId === "heavy-memory" ? 58 : 48;
  return Math.round(base + cpu * 0.22);
}

export function deriveFanStatus(
  profileId: SimulationProfileId,
  tempC: number,
): DiagnosticReading["fanStatus"] {
  if (tempC >= 82 || profileId === "aging") return "strained";
  if (tempC >= 70) return "elevated";
  return "normal";
}

export function deriveStartupSeconds(profileId: SimulationProfileId, diskUsed: number): number {
  const base =
    profileId === "aging" ? 95 : profileId === "developer" ? 58 : profileId === "low-disk" ? 72 : 38;
  return Math.round(base + Math.max(0, diskUsed - 70) * 0.45);
}

export function buildDiagnosticReading(input: {
  system: SystemSnapshot;
  memory: MemorySnapshot;
  network: NetworkSnapshot;
  liveMetrics: SystemSnapshot["metrics"] | null;
  healthScore: number;
  profileId: SimulationProfileId;
  profileLabel: string;
  startupOverrides?: { id: string; enabled: boolean }[];
}): DiagnosticReading {
  const metrics = input.liveMetrics ?? input.system.metrics;
  const primary = input.system.drives[0];
  const capacityGb = primary?.capacityGb ?? 512;
  const usedGb = primary?.usedGb ?? Math.round(capacityGb * 0.5);
  const diskUsedPercent = Math.round((usedGb / capacityGb) * 100);
  const freeGb = Math.round((capacityGb - usedGb) * 10) / 10;
  const reservedGb = Math.round(capacityGb * 0.03);
  const dnsMs = Math.round(
    input.network.dnsResults.reduce((sum, item) => sum + item.responseMs, 0) /
      Math.max(1, input.network.dnsResults.length),
  );
  const topMem = [...input.memory.processes].sort((a, b) => b.memoryMb - a.memoryMb)[0];
  const topCpu = [...input.memory.processes].sort((a, b) => b.cpu - a.cpu)[0];
  const cpuTempC = deriveCpuTempC(input.profileId, metrics.cpu);

  const defaultStartup: DiagnosticReading["startupItems"] = [
    { id: "cloud-sync", name: "Cloud sync client", impact: "high", enabled: true },
    { id: "chat", name: "Chat launcher", impact: "medium", enabled: true },
    { id: "updater", name: "App updater service", impact: "medium", enabled: true },
    { id: "music", name: "Music helper", impact: "low", enabled: true },
    { id: "clipboard", name: "Clipboard utility", impact: "low", enabled: false },
  ];
  const startupItems = defaultStartup.map((item) => {
    const override = input.startupOverrides?.find((entry) => entry.id === item.id);
    return override ? { ...item, enabled: override.enabled } : item;
  });

  if (input.profileId === "aging" || input.profileId === "developer") {
    startupItems.forEach((item) => {
      if (item.impact !== "low") item.enabled = true;
    });
  }

  const mediaGb = Math.round(usedGb * 0.28);
  const appsGb = Math.round(usedGb * 0.34);
  const tempGb = Math.round(usedGb * (input.profileId === "low-disk" ? 0.12 : 0.06));
  const downloadsGb = Math.round(usedGb * 0.14);
  const otherGb = Math.max(0, usedGb - mediaGb - appsGb - tempGb - downloadsGb);

  return {
    cpu: metrics.cpu,
    memory: metrics.memory,
    diskActivity: metrics.disk,
    diskUsedPercent,
    freeGb,
    capacityGb,
    reservedGb,
    latency: input.network.quality.latency,
    packetLoss: input.network.quality.packetLoss,
    dnsMs,
    connectionType: input.network.connectionType,
    connected: input.network.connected,
    healthScore: input.healthScore,
    cpuTempC,
    fanStatus: deriveFanStatus(input.profileId, cpuTempC),
    startupSeconds: deriveStartupSeconds(input.profileId, diskUsedPercent),
    profileId: input.profileId,
    profileLabel: input.profileLabel,
    topMemoryProcess: topMem?.name,
    topCpuProcess: topCpu?.name,
    storageCategories: [
      { label: "Applications", gb: appsGb },
      { label: "Media & documents", gb: mediaGb },
      { label: "Downloads", gb: downloadsGb },
      { label: "Temporary files", gb: tempGb },
      { label: "Other", gb: otherGb },
    ],
    startupItems,
  };
}

export function evaluateCondition(condition: GuideCondition, reading: DiagnosticReading): boolean {
  if ("all" in condition) return condition.all.every((item) => evaluateCondition(item, reading));
  if ("any" in condition) return condition.any.some((item) => evaluateCondition(item, reading));
  if ("not" in condition) return !evaluateCondition(condition.not, reading);

  const current = reading[condition.metric];
  if (typeof current !== "number") return false;
  return condition.op === "gte" ? current >= condition.value : current < condition.value;
}

export function resolveBranchNext(
  step: Extract<TroubleshootingStep, { type: "diagnostic-check" }>,
  reading: DiagnosticReading,
): string {
  for (const branch of step.branches) {
    if (evaluateCondition(branch.when, reading)) return branch.next;
  }
  return step.defaultNext;
}

export function resolveBranchFindingId(
  step: Extract<TroubleshootingStep, { type: "diagnostic-check" }>,
  reading: DiagnosticReading,
): string | undefined {
  for (const branch of step.branches) {
    if (evaluateCondition(branch.when, reading)) return branch.findingId;
  }
  return undefined;
}

export function statusLabel(status: CheckStatus): string {
  switch (status) {
    case "normal":
      return "Normal";
    case "monitor":
      return "Monitor";
    case "attention":
      return "Attention";
    case "high":
      return "High";
  }
}

export const DIAGNOSTIC_CHECKS: Record<string, DiagnosticCheckDef> = {
  cpu: {
    id: "cpu",
    label: "CPU usage",
    healthyRange: "approximately 10–40% during ordinary interactive work",
    read: (reading) => {
      const status: CheckStatus =
        reading.cpu >= 75 ? "high" : reading.cpu >= 45 ? "attention" : reading.cpu >= 35 ? "monitor" : "normal";
      return {
        current: `${Math.round(reading.cpu)}%`,
        numeric: reading.cpu,
        status,
        interpretation:
          status === "high"
            ? "Sustained CPU load may contribute to sluggish response times."
            : status === "attention"
              ? "CPU usage is elevated and may contribute to temporary slowdowns."
              : "CPU usage looks ordinary for interactive work in this simulation.",
      };
    },
  },
  memory: {
    id: "memory",
    label: "Memory usage",
    healthyRange: "approximately 40–75% during ordinary use",
    read: (reading) => {
      const status: CheckStatus =
        reading.memory >= 85
          ? "high"
          : reading.memory >= 75
            ? "attention"
            : reading.memory >= 65
              ? "monitor"
              : "normal";
      return {
        current: `${Math.round(reading.memory)}%`,
        numeric: reading.memory,
        status,
        interpretation:
          status === "high"
            ? "High memory pressure may be contributing to slow performance."
            : status === "attention"
              ? "Memory use is elevated; background apps may be competing for RAM."
              : "Memory headroom looks comfortable in this simulation.",
      };
    },
  },
  processes: {
    id: "processes",
    label: "Active processes",
    healthyRange: "no single consumer dominating RAM or CPU for long periods",
    read: (reading) => {
      const hot = reading.memory >= 80 || reading.cpu >= 55;
      const status: CheckStatus = hot ? "attention" : "normal";
      return {
        current: reading.topMemoryProcess
          ? `${reading.topMemoryProcess} (top memory) · ${reading.topCpuProcess ?? "n/a"} (top CPU)`
          : "Process list available in MemoryMedic",
        status,
        interpretation: hot
          ? "A small set of simulated processes appears to account for most resource use."
          : "No single process stands out as an obvious bottleneck in this simulation.",
      };
    },
  },
  storage: {
    id: "storage",
    label: "Free disk space",
    healthyRange: "at least ~15% free on the system volume",
    read: (reading) => {
      const status: CheckStatus =
        reading.diskUsedPercent >= 90
          ? "high"
          : reading.diskUsedPercent >= 80
            ? "attention"
            : reading.diskUsedPercent >= 70
              ? "monitor"
              : "normal";
      return {
        current: `${reading.freeGb} GB free of ${reading.capacityGb} GB (${reading.diskUsedPercent}% used)`,
        numeric: reading.diskUsedPercent,
        status,
        interpretation:
          status === "high"
            ? "Limited free space can slow updates, caching, and virtual memory behavior."
            : status === "attention"
              ? "Free space is getting low; cleanup may improve long-term responsiveness."
              : "Storage capacity looks adequate for ordinary work in this simulation.",
      };
    },
  },
  startup: {
    id: "startup",
    label: "Startup impact",
    healthyRange: "few high-impact launchers enabled at sign-in",
    read: (reading) => {
      const enabledHigh = reading.startupItems.filter((item) => item.enabled && item.impact !== "low").length;
      const status: CheckStatus =
        reading.startupSeconds >= 80 || enabledHigh >= 3
          ? "attention"
          : enabledHigh >= 2
            ? "monitor"
            : "normal";
      return {
        current: `~${reading.startupSeconds}s estimated · ${enabledHigh} higher-impact items enabled`,
        numeric: reading.startupSeconds,
        status,
        interpretation:
          status === "attention"
            ? "Startup backlog may contribute to a slow first few minutes after login."
            : "Startup load looks moderate in this simulation.",
      };
    },
  },
  connection: {
    id: "connection",
    label: "Connection state",
    healthyRange: "connected with a stable link",
    read: (reading) => ({
      current: reading.connected
        ? `Connected · ${reading.connectionType}`
        : "Disconnected",
      status: reading.connected ? "normal" : "high",
      interpretation: reading.connected
        ? "The simulated adapter reports an active connection."
        : "The simulation shows no active connection—connectivity checks come first.",
    }),
  },
  latency: {
    id: "latency",
    label: "Latency",
    healthyRange: "approximately 10–40 ms for a healthy local/ISP path",
    read: (reading) => {
      const status: CheckStatus =
        reading.latency >= 100 ? "high" : reading.latency >= 60 ? "attention" : reading.latency >= 40 ? "monitor" : "normal";
      return {
        current: `${reading.latency} ms`,
        numeric: reading.latency,
        status,
        interpretation:
          status === "normal"
            ? "Latency looks ordinary for interactive browsing in this simulation."
            : "Elevated latency may contribute to pages and calls feeling sluggish.",
      };
    },
  },
  packetLoss: {
    id: "packetLoss",
    label: "Packet loss",
    healthyRange: "near 0% on a stable link",
    read: (reading) => {
      const status: CheckStatus =
        reading.packetLoss >= 2 ? "high" : reading.packetLoss >= 1 ? "attention" : reading.packetLoss > 0.3 ? "monitor" : "normal";
      return {
        current: `${reading.packetLoss}%`,
        numeric: reading.packetLoss,
        status,
        interpretation:
          status === "normal"
            ? "Packet loss is negligible in this simulation."
            : "Packet loss can cause retries, stuttering media, and uneven responsiveness.",
      };
    },
  },
  dns: {
    id: "dns",
    label: "DNS response time",
    healthyRange: "typically under ~40 ms for common resolvers",
    read: (reading) => {
      const status: CheckStatus =
        reading.dnsMs >= 80 ? "high" : reading.dnsMs >= 50 ? "attention" : reading.dnsMs >= 35 ? "monitor" : "normal";
      return {
        current: `${reading.dnsMs} ms average`,
        numeric: reading.dnsMs,
        status,
        interpretation:
          status === "normal"
            ? "DNS responses look timely in this simulation."
            : "Slow DNS can make browsing feel delayed even when throughput looks fine.",
      };
    },
  },
  temperature: {
    id: "temperature",
    label: "CPU temperature (simulated)",
    healthyRange: "roughly under ~75°C for sustained interactive work",
    read: (reading) => {
      const status: CheckStatus =
        reading.cpuTempC >= 85 ? "high" : reading.cpuTempC >= 75 ? "attention" : reading.cpuTempC >= 68 ? "monitor" : "normal";
      return {
        current: `${reading.cpuTempC}°C · fan ${reading.fanStatus}`,
        numeric: reading.cpuTempC,
        status,
        interpretation:
          status === "normal"
            ? "Thermal readings look ordinary for this simulated workload."
            : "Elevated temperature may accompany sustained load or restricted airflow.",
      };
    },
  },
};

export function getStepMap(workflow: TroubleshootingWorkflow) {
  return Object.fromEntries(workflow.steps.map((step) => [step.id, step]));
}

export function countLinearSteps(workflow: TroubleshootingWorkflow) {
  return workflow.steps.filter((step) => step.type !== "summary").length + 1;
}

export function validateWorkflow(workflow: TroubleshootingWorkflow): string[] {
  const errors: string[] = [];
  const ids = workflow.steps.map((step) => step.id);
  if (new Set(ids).size !== ids.length) errors.push(`${workflow.id}: duplicate step ids`);
  if (!ids.includes("intro")) errors.push(`${workflow.id}: missing intro step`);
  if (!workflow.steps.some((step) => step.type === "summary")) {
    errors.push(`${workflow.id}: missing summary step`);
  }

  const targets = new Set<string>();
  for (const step of workflow.steps) {
    if ("next" in step && typeof step.next === "string") targets.add(step.next);
    if (step.type === "question") step.options.forEach((option) => targets.add(option.next));
    if (step.type === "diagnostic-check") {
      targets.add(step.defaultNext);
      step.branches.forEach((branch) => targets.add(branch.next));
    }
  }
  for (const target of targets) {
    if (!ids.includes(target)) errors.push(`${workflow.id}: missing branch target ${target}`);
  }
  return errors;
}

export function fillConclusion(
  template: string,
  reading: DiagnosticReading,
  findingTitles: string[],
): string {
  return template
    .replaceAll("{profile}", reading.profileLabel)
    .replaceAll("{findings}", findingTitles.length ? findingTitles.join("; ") : "no major local pressure signals")
    .replaceAll("{memory}", `${Math.round(reading.memory)}%`)
    .replaceAll("{cpu}", `${Math.round(reading.cpu)}%`)
    .replaceAll("{disk}", `${reading.diskUsedPercent}%`)
    .replaceAll("{latency}", `${reading.latency} ms`)
    .replaceAll("{health}", `${reading.healthScore}`);
}
