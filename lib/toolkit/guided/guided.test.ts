import { describe, expect, it } from "vitest";
import { applyRemediation } from "@/lib/toolkit/guided/actions";
import {
  buildDiagnosticReading,
  evaluateCondition,
  resolveBranchNext,
  validateWorkflow,
} from "@/lib/toolkit/guided/engine";
import { buildGuideReport } from "@/lib/toolkit/guided/report";
import {
  guideSessionReducer,
  initialGuideSession,
  sessionHasProgress,
} from "@/lib/toolkit/guided/session";
import { WORKFLOWS, getWorkflow } from "@/lib/toolkit/guided/workflows";
import type { DiagnosticReading } from "@/lib/toolkit/guided/types";
import type {
  MemorySnapshot,
  NetworkSnapshot,
  SystemSnapshot,
} from "@/lib/toolkit/types";

const baseSystem: SystemSnapshot = {
  deviceName: "DEMO",
  operatingSystem: "Windows 11",
  architecture: "x64",
  uptime: "1 day",
  manufacturer: "Demo",
  model: "Box",
  health: 90,
  metrics: { cpu: 22, memory: 55, disk: 40, gpu: 12, network: 8 },
  hardware: [],
  drives: [
    {
      id: "c",
      mount: "C:",
      model: "NVMe",
      capacityGb: 1000,
      usedGb: 520,
      fileSystem: "NTFS",
      type: "NVMe SSD",
      status: "healthy",
      health: 95,
    },
  ],
  findings: [],
};

const baseMemory: MemorySnapshot = {
  installedGb: 32,
  inUseGb: 16,
  availableGb: 16,
  cachedGb: 4,
  committedGb: 18,
  compressedMb: 200,
  usagePercent: 50,
  health: "healthy",
  timeline: { "5m": [], "30m": [], "1h": [] },
  processes: [
    {
      id: "browser",
      name: "Browser",
      category: "Browser",
      memoryMb: 4200,
      percentage: 12,
      cpu: 8,
      status: "attention",
    },
    {
      id: "editor",
      name: "Editor",
      category: "Development",
      memoryMb: 1800,
      percentage: 5,
      cpu: 14,
      status: "healthy",
    },
  ],
  findings: [],
};

const baseNetwork: NetworkSnapshot = {
  connected: true,
  connectionType: "Wi-Fi",
  ipv4: "192.168.1.20",
  gateway: "192.168.1.1",
  dnsProvider: "Demo DNS",
  publicIp: "203.0.113.10",
  link: "Wi-Fi 6",
  profile: "Private",
  quality: {
    download: 220,
    upload: 40,
    latency: 22,
    jitter: 2,
    packetLoss: 0.1,
    score: 94,
  },
  adapters: [],
  devices: [],
  dnsResults: [
    { provider: "A", responseMs: 18, reliability: 99, description: "", bestFor: "" },
    { provider: "B", responseMs: 22, reliability: 98, description: "", bestFor: "" },
  ],
  findings: [],
};

function reading(partial?: Partial<DiagnosticReading>): DiagnosticReading {
  return {
    ...buildDiagnosticReading({
      system: baseSystem,
      memory: baseMemory,
      network: baseNetwork,
      liveMetrics: baseSystem.metrics,
      healthScore: 90,
      profileId: "healthy",
      profileLabel: "Healthy System",
    }),
    ...partial,
  };
}

describe("guided workflows", () => {
  it("exposes six distinct workflows with unique step ids and reachable branches", () => {
    expect(WORKFLOWS).toHaveLength(6);
    const titles = WORKFLOWS.map((item) => item.title);
    expect(new Set(titles).size).toBe(6);

    for (const workflow of WORKFLOWS) {
      const errors = validateWorkflow(workflow);
      expect(errors).toEqual([]);
      expect(workflow.steps.some((step) => step.type === "summary")).toBe(true);
      expect(workflow.recommendedScenario).toBeTruthy();
    }
  });

  it("keeps workflow paths meaningfully different", () => {
    const slow = getWorkflow("slow-computer")!;
    const net = getWorkflow("slow-internet")!;
    const storage = getWorkflow("storage-full")!;
    expect(slow.steps.some((step) => step.type === "diagnostic-check" && step.checkId === "memory")).toBe(
      true,
    );
    expect(net.steps.some((step) => step.type === "diagnostic-check" && step.checkId === "packetLoss")).toBe(
      true,
    );
    expect(storage.steps.some((step) => step.type === "action" && step.remediation === "clear-temp-files")).toBe(
      true,
    );
  });
});

describe("guided session reducer", () => {
  it("supports start, advance, back, skip, exit, resume, and restart", () => {
    let state = initialGuideSession();
    state = guideSessionReducer(state, {
      type: "SELECT_WORKFLOW",
      workflowId: "slow-computer",
      recommendedScenario: "heavy-memory",
    });
    expect(state.status).toBe("scenario-prompt");
    expect(sessionHasProgress(state)).toBe(true);

    state = guideSessionReducer(state, {
      type: "DECIDE_SCENARIO",
      decision: "kept-current",
    });
    state = guideSessionReducer(state, { type: "START_WORKFLOW", firstStepId: "intro" });
    expect(state.currentStepId).toBe("intro");

    state = guideSessionReducer(state, {
      type: "ADVANCE",
      fromStepId: "intro",
      nextStepId: "check-cpu",
    });
    expect(state.completedStepIds).toContain("intro");

    state = guideSessionReducer(state, {
      type: "SKIP",
      fromStepId: "check-cpu",
      nextStepId: "check-memory",
    });
    expect(state.skippedStepIds).toContain("check-cpu");

    state = guideSessionReducer(state, { type: "BACK" });
    expect(state.currentStepId).toBe("check-cpu");

    state = guideSessionReducer(state, { type: "EXIT" });
    expect(state.status).toBe("home");
    expect(state.workflowId).toBe("slow-computer");

    state = guideSessionReducer(state, {
      type: "HYDRATE",
      session: { ...state, status: "active", currentStepId: "check-memory" },
    });
    expect(state.status).toBe("active");

    state = guideSessionReducer(state, { type: "RESTART" });
    expect(state.status).toBe("scenario-prompt");
    expect(state.completedStepIds).toEqual([]);
  });
});

describe("guided branching", () => {
  it("routes high-memory and healthy-memory differently", () => {
    const workflow = getWorkflow("slow-computer")!;
    const memoryStep = workflow.steps.find(
      (step) => step.id === "check-memory" && step.type === "diagnostic-check",
    );
    expect(memoryStep?.type).toBe("diagnostic-check");
    if (memoryStep?.type !== "diagnostic-check") return;

    expect(resolveBranchNext(memoryStep, reading({ memory: 91 }))).toBe("link-memory");
    expect(resolveBranchNext(memoryStep, reading({ memory: 55 }))).toBe("check-processes");
  });

  it("prioritizes DNS when packet loss is low but DNS is slow", () => {
    const workflow = getWorkflow("slow-internet")!;
    const lossStep = workflow.steps.find(
      (step) => step.id === "check-loss" && step.type === "diagnostic-check",
    );
    if (lossStep?.type !== "diagnostic-check") throw new Error("missing loss step");

    const dnsFinding = lossStep.branches.find((branch) => branch.findingId === "dns-slow");
    expect(dnsFinding).toBeTruthy();
    expect(
      evaluateCondition(dnsFinding!.when, reading({ packetLoss: 0.2, dnsMs: 90, latency: 30 })),
    ).toBe(true);

    const okFinding = lossStep.branches.find((branch) => branch.findingId === "network-ok");
    expect(
      evaluateCondition(okFinding!.when, reading({ packetLoss: 0.1, latency: 20, dnsMs: 18 })),
    ).toBe(true);
  });

  it("marks low-storage versus normal storage", () => {
    const workflow = getWorkflow("storage-full")!;
    const storageStep = workflow.steps.find(
      (step) => step.id === "check-storage" && step.type === "diagnostic-check",
    );
    if (storageStep?.type !== "diagnostic-check") throw new Error("missing storage step");
    expect(resolveBranchNext(storageStep, reading({ diskUsedPercent: 94 }))).toBe("categories");
    expect(resolveBranchNext(storageStep, reading({ diskUsedPercent: 50 }))).toBe("categories");
  });
});

describe("guided simulated actions", () => {
  it("applies deterministic metric changes without real system calls", () => {
    const close = applyRemediation({
      kind: "close-unused-process",
      system: baseSystem,
      memory: baseMemory,
      network: baseNetwork,
      liveMetrics: { cpu: 40, memory: 90, disk: 45, gpu: 10, network: 6 },
      healthScore: 78,
    });
    expect(close.record.before.memory).toBe(90);
    expect(Number(close.record.after.memory)).toBeLessThan(90);
    expect(close.record.note.toLowerCase()).toContain("simulated");

    const cleanup = applyRemediation({
      kind: "clear-temp-files",
      system: {
        ...baseSystem,
        drives: [{ ...baseSystem.drives[0], usedGb: 940, capacityGb: 1000, status: "attention" }],
      },
      memory: baseMemory,
      network: baseNetwork,
      liveMetrics: baseSystem.metrics,
      healthScore: 74,
    });
    expect(Number(cleanup.record.after.usedGb)).toBeLessThan(940);

    const router = applyRemediation({
      kind: "restart-router",
      system: baseSystem,
      memory: baseMemory,
      network: {
        ...baseNetwork,
        quality: { ...baseNetwork.quality, latency: 140, packetLoss: 3 },
      },
      liveMetrics: baseSystem.metrics,
      healthScore: 80,
    });
    expect(Number(router.record.after.latency)).toBeLessThan(140);
  });
});

describe("guided reports", () => {
  it("includes workflow, scenario, checks, and demo disclaimer", () => {
    let state = initialGuideSession();
    state = guideSessionReducer(state, {
      type: "SELECT_WORKFLOW",
      workflowId: "slow-computer",
      recommendedScenario: "heavy-memory",
    });
    state = guideSessionReducer(state, {
      type: "DECIDE_SCENARIO",
      decision: "loaded-recommended",
    });
    state = guideSessionReducer(state, { type: "START_WORKFLOW", firstStepId: "intro" });
    state = guideSessionReducer(state, {
      type: "ADVANCE",
      fromStepId: "intro",
      nextStepId: "summary",
      finding: {
        id: "mem-high",
        stepId: "check-memory",
        category: "Memory",
        observedValue: "91%",
        status: "high",
        explanation: "High memory pressure may be contributing to slow performance.",
        relatedModule: "memory",
        confidence: "Likely contributor",
        nextAction: "Close unused apps",
      },
      actionIds: ["closeApps"],
    });
    state = guideSessionReducer(state, { type: "SKIP", fromStepId: "check-cpu", nextStepId: "summary" });
    state = guideSessionReducer(state, { type: "COMPLETE", at: new Date().toISOString() });

    const report = buildGuideReport({
      session: state,
      reading: reading({ memory: 91, profileLabel: "Heavy Memory Usage" }),
      healthScore: 78,
    });

    expect(report).toBeTruthy();
    expect(report!.name).toContain("Computer Running Slowly");
    expect(report!.activeProfile).toBe("Heavy Memory Usage");
    expect(report!.systemSummary).toMatch(/Workflow:/i);
    expect(report!.systemSummary).toMatch(/Skipped checks/i);
    expect(report!.systemSummary?.toLowerCase()).toContain("demo");
    expect(report!.demoMode).toBe(true);
    expect(report!.recommendations.some((item) => item.title.includes("Close unused"))).toBe(true);
  });
});
