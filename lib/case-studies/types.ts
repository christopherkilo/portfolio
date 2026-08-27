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

export type CaseStudy = {
  projectId: string;
  overview: string;
  problem: string;
  approach: string;
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
  /** Overrides the default “Key decisions and why” heading. */
  decisionsHeading?: string;
  /** Grouped stack labels for the case-study header. */
  techGroups?: TechGroup[];
  /** Longer “why this service” explanations. */
  deepDives?: { title: string; explanation: string }[];
  outcome: string;
  learned?: string;
  currentState?: {
    implemented: string[];
    demo?: string[];
    planned?: string[];
  };
  decisions?: { title: string; explanation: string }[];
  nextSteps?: string[];
  /** Overrides the generic next-steps intro on the case-study page */
  nextStepsIntro?: string;
  highlights: string[];
  metrics: { label: string; value: string; detail: string }[];
  charts: CaseStudyChart[];
};
