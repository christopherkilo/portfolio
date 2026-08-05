import type {
  MemorySnapshot,
  NetworkSnapshot,
  SystemSnapshot,
} from "@/lib/toolkit/types";
import type { RemediationKind, SimulatedActionRecord } from "@/lib/toolkit/guided/types";

export type SimulationPatch = {
  liveMetrics?: SystemSnapshot["metrics"];
  system?: SystemSnapshot;
  memory?: MemorySnapshot;
  network?: NetworkSnapshot;
  healthScore?: number;
};

export type RemediationResult = {
  record: SimulatedActionRecord;
  patch: SimulationPatch;
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function applyRemediation(input: {
  kind: RemediationKind;
  system: SystemSnapshot;
  memory: MemorySnapshot;
  network: NetworkSnapshot;
  liveMetrics: SystemSnapshot["metrics"];
  healthScore: number;
}): RemediationResult {
  const at = new Date().toISOString();
  const { kind, system, memory, network, liveMetrics, healthScore } = input;

  switch (kind) {
    case "close-unused-process": {
      const beforeMem = liveMetrics.memory;
      const nextMem = Math.max(42, round1(beforeMem - 12));
      const nextMetrics = { ...liveMetrics, memory: nextMem, cpu: Math.max(8, round1(liveMetrics.cpu - 4)) };
      const nextMemory: MemorySnapshot = {
        ...memory,
        usagePercent: Math.round(nextMem),
        inUseGb: round1((memory.installedGb * nextMem) / 100),
        availableGb: round1(memory.installedGb - (memory.installedGb * nextMem) / 100),
        health: nextMem >= 85 ? "attention" : "healthy",
        processes: memory.processes.map((process, index) =>
          index === 0
            ? {
                ...process,
                memoryMb: Math.max(400, Math.round(process.memoryMb * 0.55)),
                percentage: round1(process.percentage * 0.55),
                status: "healthy",
                recommendation: "Simulated close completed for demo.",
              }
            : process,
        ),
      };
      return {
        record: {
          id: `action-${kind}-${at}`,
          kind,
          label: "Simulate closing an unused process",
          at,
          before: { memory: beforeMem },
          after: { memory: nextMem },
          note: "Simulated only — no real process was terminated.",
        },
        patch: {
          liveMetrics: nextMetrics,
          memory: nextMemory,
          healthScore: Math.min(99, healthScore + 2),
        },
      };
    }
    case "clear-temp-files": {
      const drive = system.drives[0];
      const beforeUsed = drive?.usedGb ?? 0;
      const recovered = Math.min(28, Math.max(8, Math.round((drive?.capacityGb ?? 512) * 0.04)));
      const nextUsed = Math.max(Math.round((drive?.capacityGb ?? 512) * 0.45), beforeUsed - recovered);
      const nextSystem: SystemSnapshot = {
        ...system,
        drives: system.drives.map((item, index) =>
          index === 0
            ? {
                ...item,
                usedGb: nextUsed,
                status: nextUsed / item.capacityGb > 0.9 ? "attention" : "healthy",
              }
            : item,
        ),
        metrics: { ...liveMetrics, disk: Math.max(20, round1(liveMetrics.disk - 8)) },
      };
      return {
        record: {
          id: `action-${kind}-${at}`,
          kind,
          label: "Simulate clearing temporary files",
          at,
          before: { usedGb: beforeUsed, freeGb: (drive?.capacityGb ?? 0) - beforeUsed },
          after: { usedGb: nextUsed, freeGb: (drive?.capacityGb ?? 0) - nextUsed, recoveredGb: recovered },
          note: "Simulated cleanup only — no real files were deleted.",
        },
        patch: {
          system: nextSystem,
          liveMetrics: nextSystem.metrics,
          healthScore: Math.min(99, healthScore + 3),
        },
      };
    }
    case "disable-startup-item": {
      return {
        record: {
          id: `action-${kind}-${at}`,
          kind,
          label: "Simulate disabling a startup item",
          at,
          before: { startupImpact: "higher" },
          after: { startupImpact: "reduced" },
          note: "Simulated startup change only — your real login items were not modified.",
        },
        patch: {
          liveMetrics: {
            ...liveMetrics,
            cpu: Math.max(10, round1(liveMetrics.cpu - 3)),
            memory: Math.max(40, round1(liveMetrics.memory - 4)),
          },
          healthScore: Math.min(99, healthScore + 1),
        },
      };
    }
    case "restart-router": {
      const beforeLatency = network.quality.latency;
      const beforeLoss = network.quality.packetLoss;
      const nextNetwork: NetworkSnapshot = {
        ...network,
        quality: {
          ...network.quality,
          latency: Math.max(16, Math.round(beforeLatency * 0.45)),
          packetLoss: Math.max(0, round1(beforeLoss * 0.2)),
          jitter: Math.max(1, round1(network.quality.jitter * 0.5)),
          score: Math.min(97, network.quality.score + 12),
        },
        dnsResults: network.dnsResults.map((dns) => ({
          ...dns,
          responseMs: Math.max(12, Math.round(dns.responseMs * 0.55)),
        })),
      };
      return {
        record: {
          id: `action-${kind}-${at}`,
          kind,
          label: "Simulate restarting the router",
          at,
          before: { latency: beforeLatency, packetLoss: beforeLoss },
          after: {
            latency: nextNetwork.quality.latency,
            packetLoss: nextNetwork.quality.packetLoss,
          },
          note: "Simulated gateway restart — no real router was contacted.",
        },
        patch: {
          network: nextNetwork,
          healthScore: Math.min(99, healthScore + 2),
        },
      };
    }
    case "reconnect-network": {
      const nextNetwork: NetworkSnapshot = {
        ...network,
        connected: true,
        quality: {
          ...network.quality,
          latency: Math.max(18, Math.round(network.quality.latency * 0.7)),
          packetLoss: Math.max(0, round1(network.quality.packetLoss * 0.5)),
          score: Math.min(96, network.quality.score + 6),
        },
      };
      return {
        record: {
          id: `action-${kind}-${at}`,
          kind,
          label: "Simulate reconnecting to the network",
          at,
          before: { connected: network.connected ? "yes" : "no", latency: network.quality.latency },
          after: { connected: "yes", latency: nextNetwork.quality.latency },
          note: "Simulated reconnect only — no real adapter settings were changed.",
        },
        patch: {
          network: nextNetwork,
          healthScore: Math.min(99, healthScore + 1),
        },
      };
    }
  }
}
