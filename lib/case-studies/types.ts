export type ChartPoint = { label: string; value: number };

export type CaseStudyChart = {
  id: string;
  title: string;
  description: string;
  type: "line" | "bar" | "area";
  unit?: string;
  series: ChartPoint[];
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
