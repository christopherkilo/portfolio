import { describe, expect, it } from "vitest";
import { recommendRam } from "./recommendation-engine";
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
