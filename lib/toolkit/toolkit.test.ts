import { describe, expect, it } from "vitest";
import { recommendRam } from "./recommendation-engine";
import {
  createRng,
  pickRecommendations,
  scoreLabel,
  smoothDrift,
  statusFromScore,
} from "./simulation";
import {
  SCENARIO_OPTIONS,
  applyScenarioToSystem,
  getProfile,
  profileMetrics,
  recommendationsForProfile,
} from "./scenarios";
import { ISSUE_CATEGORIES, TROUBLESHOOTING_TREES } from "./troubleshooting-trees";

describe("recommendRam", () => {
  it("keeps ordinary office workloads at 16 GB", () => {
    const result = recommendRam({
      installedGb: 16,
      workload: "Office and browsing",
      applicationCount: 6,
      gaming: false,
      virtualMachines: false,
      creativeWork: false,
      futureWorkload: "Similar",
    });

    expect(result.recommendedGb).toBe(16);
    expect(result.meetsTarget).toBe(true);
  });

  it("recommends 32 GB for gaming and heavy multitasking", () => {
    const result = recommendRam({
      installedGb: 16,
      workload: "Gaming",
      applicationCount: 12,
      gaming: true,
      virtualMachines: false,
      creativeWork: false,
      futureWorkload: "Moderately heavier",
    });

    expect(result.recommendedGb).toBe(32);
    expect(result.meetsTarget).toBe(false);
  });

  it("reserves 64 GB guidance for advanced combined pressure", () => {
    const result = recommendRam({
      installedGb: 32,
      workload: "Virtual machines",
      applicationCount: 14,
      gaming: false,
      virtualMachines: true,
      creativeWork: false,
      futureWorkload: "Significantly heavier",
    });

    expect(result.recommendedGb).toBe(64);
  });
});

describe("troubleshooting trees", () => {
  it("provides a valid starting node and reachable destinations for every issue", () => {
    for (const issue of ISSUE_CATEGORIES) {
      const tree = TROUBLESHOOTING_TREES[issue.id];
      const ids = new Set(tree.map((node) => node.id));

      expect(ids.has("start")).toBe(true);
      for (const node of tree) {
        for (const option of node.options ?? []) {
          expect(ids.has(option.nextId)).toBe(true);
        }
      }
    }
  });

  it("includes safety and escalation guidance in every result", () => {
    const resultNodes = Object.values(TROUBLESHOOTING_TREES)
      .flat()
      .filter((node) => node.result);

    expect(resultNodes.length).toBeGreaterThan(0);
    for (const node of resultNodes) {
      expect(node.result?.safetyNote).toBeTruthy();
      expect(node.result?.escalation).toBeTruthy();
    }
  });
});

describe("simulation helpers", () => {
  it("keeps deterministic drift inside bounds", () => {
    const random = createRng(123);
    let value = 20;
    for (let index = 0; index < 40; index += 1) {
      value = smoothDrift(value, 14, 28, 2.5, random);
      expect(value).toBeGreaterThanOrEqual(14);
      expect(value).toBeLessThanOrEqual(28);
    }
  });

  it("picks recommendation sets with priority metadata", () => {
    const selected = pickRecommendations(99, 3);
    expect(selected).toHaveLength(3);
    expect(new Set(selected.map((item) => item.id)).size).toBe(3);
    for (const item of selected) {
      expect(item.reason).toBeTruthy();
      expect(item.benefit).toBeTruthy();
    }
  });

  it("maps health scores to reassuring labels", () => {
    expect(scoreLabel(94)).toBe("Optimized");
    expect(scoreLabel(90)).toBe("Healthy");
    expect(statusFromScore(90)).toBe("healthy");
    expect(statusFromScore(76)).toBe("attention");
  });
});

describe("scenario profiles", () => {
  it("exposes every required simulation profile", () => {
    const ids = SCENARIO_OPTIONS.map((item) => item.id);
    expect(ids).toEqual([
      "healthy",
      "heavy-memory",
      "network-instability",
      "low-disk",
      "developer",
      "aging",
      "custom",
    ]);
  });

  it("keeps heavy-memory metrics elevated and network instability latency high", () => {
    const heavy = getProfile("heavy-memory");
    const network = getProfile("network-instability");
    const metricsHeavy = profileMetrics(heavy, 11);
    const metricsNet = profileMetrics(network, 22);

    expect(metricsHeavy.memory).toBeGreaterThanOrEqual(85);
    expect(metricsHeavy.memory).toBeLessThanOrEqual(95);
    expect(metricsNet.cpu).toBeGreaterThanOrEqual(network.cpu.min);
    expect(network.latency.min).toBeGreaterThanOrEqual(80);
    expect(recommendationsForProfile(heavy).some((item) => item.title.includes("Close unused"))).toBe(
      true,
    );
    expect(recommendationsForProfile(network)[0]?.module).toBe("network");
  });

  it("applies low-disk capacity pressure to the primary volume", () => {
    const base = {
      deviceName: "TEST",
      operatingSystem: "OS",
      architecture: "x64",
      uptime: "1 day",
      manufacturer: "M",
      model: "Model",
      health: 90,
      metrics: { cpu: 20, memory: 50, disk: 40, gpu: 10, network: 5 },
      hardware: [],
      drives: [
        {
          id: "c",
          mount: "C:",
          model: "Drive",
          capacityGb: 1000,
          usedGb: 400,
          fileSystem: "NTFS",
          type: "NVMe SSD" as const,
          status: "healthy" as const,
          health: 95,
        },
      ],
      findings: [],
    };
    const profile = getProfile("low-disk");
    const adapted = applyScenarioToSystem(base, profile, profileMetrics(profile, 7), 78);
    expect(adapted.drives[0].usedGb / adapted.drives[0].capacityGb).toBeGreaterThan(0.89);
    expect(adapted.drives[0].status).toBe("attention");
  });
});
