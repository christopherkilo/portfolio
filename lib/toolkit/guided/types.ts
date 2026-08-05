import type { SimulationProfileId } from "@/lib/toolkit/scenarios";

export type GuideModule = "system" | "memory" | "network" | "overview";

export type CheckStatus = "normal" | "monitor" | "attention" | "high";

export type ActionClass =
  | "try-now"
  | "monitor"
  | "requires-restart"
  | "professional-support";

export type RemediationKind =
  | "close-unused-process"
  | "clear-temp-files"
  | "disable-startup-item"
  | "restart-router"
  | "reconnect-network";

export type GuideCondition =
  | { metric: "cpu"; op: "gte" | "lt"; value: number }
  | { metric: "memory"; op: "gte" | "lt"; value: number }
  | { metric: "diskUsedPercent"; op: "gte" | "lt"; value: number }
  | { metric: "latency"; op: "gte" | "lt"; value: number }
  | { metric: "packetLoss"; op: "gte" | "lt"; value: number }
  | { metric: "dnsMs"; op: "gte" | "lt"; value: number }
  | { metric: "cpuTempC"; op: "gte" | "lt"; value: number }
  | { metric: "startupSeconds"; op: "gte" | "lt"; value: number }
  | { metric: "healthScore"; op: "gte" | "lt"; value: number }
  | { all: GuideCondition[] }
  | { any: GuideCondition[] }
  | { not: GuideCondition };

export type DiagnosticReading = {
  cpu: number;
  memory: number;
  diskActivity: number;
  diskUsedPercent: number;
  freeGb: number;
  capacityGb: number;
  reservedGb: number;
  latency: number;
  packetLoss: number;
  dnsMs: number;
  connectionType: "Ethernet" | "Wi-Fi";
  connected: boolean;
  healthScore: number;
  cpuTempC: number;
  fanStatus: "normal" | "elevated" | "strained";
  startupSeconds: number;
  profileId: SimulationProfileId;
  profileLabel: string;
  topMemoryProcess?: string;
  topCpuProcess?: string;
  storageCategories: { label: string; gb: number }[];
  startupItems: { id: string; name: string; impact: "low" | "medium" | "high"; enabled: boolean }[];
};

export type TroubleshootingFinding = {
  id: string;
  category: string;
  observedValue: string;
  status: CheckStatus;
  explanation: string;
  relatedModule: GuideModule;
  confidence: string;
  nextAction: string;
  stepId: string;
};

export type RecommendedAction = {
  id: string;
  title: string;
  why: string;
  caution?: string;
  classification: ActionClass;
  simulated: boolean;
  remediation?: RemediationKind;
  relatedModule?: GuideModule;
};

export type SimulatedActionRecord = {
  id: string;
  kind: RemediationKind;
  label: string;
  at: string;
  before: Record<string, string | number>;
  after: Record<string, string | number>;
  note: string;
};

export type DiagnosticCheckDef = {
  id: string;
  label: string;
  healthyRange: string;
  read: (reading: DiagnosticReading) => {
    current: string;
    numeric?: number;
    status: CheckStatus;
    interpretation: string;
  };
};

export type StepBranch = {
  when: GuideCondition;
  next: string;
  findingId?: string;
};

type StepBase = {
  id: string;
  title: string;
};

export type IntroductionStep = StepBase & {
  type: "introduction";
  body: string;
  next: string;
};

export type QuestionStep = StepBase & {
  type: "question";
  prompt: string;
  options: { id: string; label: string; next: string }[];
};

export type DiagnosticCheckStep = StepBase & {
  type: "diagnostic-check";
  checkId: string;
  body?: string;
  branches: StepBranch[];
  defaultNext: string;
  skippable?: boolean;
};

export type ModuleLinkStep = StepBase & {
  type: "module-link";
  module: GuideModule;
  href: string;
  linkLabel: string;
  body: string;
  next: string;
  skippable?: boolean;
};

export type FindingStep = StepBase & {
  type: "finding";
  body: string;
  findingIds?: string[];
  next: string;
};

export type RecommendationStep = StepBase & {
  type: "recommendation";
  body: string;
  actionIds: string[];
  next: string;
};

export type ConfirmationStep = StepBase & {
  type: "confirmation";
  body: string;
  confirmLabel: string;
  next: string;
};

export type ActionStep = StepBase & {
  type: "action";
  body: string;
  remediation: RemediationKind;
  actionLabel: string;
  next: string;
  skippable?: boolean;
};

export type SummaryStep = StepBase & {
  type: "summary";
  conclusionTemplate: string;
};

export type TroubleshootingStep =
  | IntroductionStep
  | QuestionStep
  | DiagnosticCheckStep
  | ModuleLinkStep
  | FindingStep
  | RecommendationStep
  | ConfirmationStep
  | ActionStep
  | SummaryStep;

export type TroubleshootingWorkflow = {
  id: string;
  title: string;
  shortDescription: string;
  relatedModules: GuideModule[];
  recommendedScenario: SimulationProfileId;
  scenarioRationale: string;
  steps: TroubleshootingStep[];
  findings: Record<string, Omit<TroubleshootingFinding, "id" | "stepId" | "observedValue"> & {
    observedFrom?: keyof DiagnosticReading | "custom";
  }>;
  actions: Record<string, RecommendedAction>;
};

export type SessionStatus =
  | "idle"
  | "home"
  | "scenario-prompt"
  | "active"
  | "completed";

export type TroubleshootingSession = {
  status: SessionStatus;
  workflowId: string | null;
  currentStepId: string | null;
  completedStepIds: string[];
  skippedStepIds: string[];
  stepHistory: string[];
  answers: Record<string, string>;
  findings: TroubleshootingFinding[];
  recommendedActionIds: string[];
  simulatedActions: SimulatedActionRecord[];
  reviewedModules: GuideModule[];
  startedAt: string | null;
  completedAt: string | null;
  scenarioDecision: "pending" | "loaded-recommended" | "kept-current" | null;
  recommendedScenario: SimulationProfileId | null;
  scenarioNotice: string | null;
};

export type SessionAction =
  | { type: "OPEN_HOME" }
  | { type: "SELECT_WORKFLOW"; workflowId: string; recommendedScenario: SimulationProfileId }
  | { type: "DECIDE_SCENARIO"; decision: "loaded-recommended" | "kept-current"; notice?: string }
  | { type: "START_WORKFLOW"; firstStepId: string }
  | { type: "ANSWER"; stepId: string; optionId: string; nextStepId: string }
  | { type: "ADVANCE"; fromStepId: string; nextStepId: string; finding?: TroubleshootingFinding; actionIds?: string[] }
  | { type: "SKIP"; fromStepId: string; nextStepId: string }
  | { type: "BACK" }
  | { type: "MARK_MODULE_REVIEWED"; module: GuideModule }
  | { type: "RECORD_ACTION"; action: SimulatedActionRecord }
  | { type: "COMPLETE"; at: string }
  | { type: "RESTART" }
  | { type: "EXIT" }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; session: TroubleshootingSession };
