export type ChartPoint = { label: string; value: number };

export type CaseStudyChart = {
  id: string;
  title: string;
  description: string;
  type: "line" | "bar" | "area";
  unit?: string;
  series: ChartPoint[];
};

export type TechGroup = {
  label: string;
  items: string[];
};

export type ArchitecturePath = {
  label: string;
  steps: string[];
};

export type ArchitectureHighlight = {
  title: string;
  description?: string;
  paths: ArchitecturePath[];
};

export type ArchitectureLane = {
  title: string;
  caption: string;
  steps: string[];
};

export type ProjectSnapshot = {
  role?: string;
  type?: string;
  frontend?: string;
  backend?: string;
  cloud?: string;
  testing?: string;
  architecture?: string;
  status?: string;
};

export const VERIFICATION_CATEGORY_LABELS = {
  deployed: "Deployed",
  tested: "Tested",
  accessible: "Accessible",
  secure: "Secure",
  observable: "Observable",
  resilient: "Resilient",
  realtime: "Realtime",
  offline: "Offline-capable",
  integrated: "Integrated",
} as const;

export type VerificationCategory = keyof typeof VERIFICATION_CATEGORY_LABELS;

export type VerificationItem = {
  category: VerificationCategory;
  detail: string;
};

/**
 * External artifacts only (links, screenshots, traces).
 * Do not duplicate verification cards as a second Receipts list.
 */
export type VerificationReceipt = {
  label: string;
  href: string;
};

export type ProjectVerification = {
  items: VerificationItem[];
  receipts?: VerificationReceipt[];
  limitations?: string[];
};

export type CaseStudy = {
  projectId: string;
  overview: string;
  problem: string;
  approach: string;
  /** Recruiter-scan block near the top of the case study. */
  snapshot?: ProjectSnapshot;
  /** Verifiable engineering evidence. Omit categories that do not apply. */
  verification?: ProjectVerification;
  /** Short architecture / request flow narrative */
  howItWorks?: string;
  /** Vertical flow labels for scannable architecture */
  architecture?: string[];
  /** Compact cloud pipeline callout, rendered in the existing glass language. */
  architectureHighlight?: ArchitectureHighlight;
  /** Side-by-side persistence / workload lanes. */
  architectureLanes?: ArchitectureLane[];
  /** Shared entry path rendered above dual lanes (e.g. User → Next.js). */
  architectureEntry?: string[];
  /** Lane-section heading. Defaults to “Architecture”. */
  architectureLanesTitle?: string;
  /** Boundary/tradeoff copy for lanes — not a retelling of How it works. */
  architectureLanesDescription?: string;
  /** Overrides the default “Engineering decisions” heading. */
  decisionsHeading?: string;
  /** Grouped stack labels for the case-study header. */
  techGroups?: TechGroup[];
  outcome: string;
  learned?: string;
  currentState?: {
    implemented: string[];
    demo?: string[];
  };
  /** Canonical “why this choice” section. Do not also maintain a second decision list. */
  decisions?: { title: string; explanation: string }[];
  /** Canonical future-work list. Do not duplicate as currentState.planned. */
  nextSteps?: string[];
  metrics: { label: string; value: string; detail: string }[];
  charts: CaseStudyChart[];
};
