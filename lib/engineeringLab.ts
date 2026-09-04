import {
  getProjectById,
  hasLiveDemo,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatusKind,
} from "@/lib/projectData";

/**
 * Visitor-facing lab rows. Status labels are shared with All Work so “Live”
 * never means both “usable demo” and “production product.”
 */
export type LabState = ProjectStatusKind;

export const LAB_STATE_LABELS = PROJECT_STATUS_LABELS;

export type EngineeringLabItem = {
  id: string;
  title: string;
  description: string;
  state: LabState;
  href: string;
  liveHref?: string;
  github?: string;
};

function fromProject(
  project: Project,
  extras: Pick<EngineeringLabItem, "state" | "description"> &
    Partial<Pick<EngineeringLabItem, "title" | "liveHref">>,
): EngineeringLabItem {
  return {
    id: project.id,
    title: extras.title ?? project.title,
    description: extras.description,
    state: extras.state,
    href: project.href ?? `/projects/${project.id}`,
    liveHref: extras.liveHref ?? (hasLiveDemo(project.liveDemo) ? project.liveDemo : undefined),
    github: project.github,
  };
}

export function getEngineeringLabItems(): EngineeringLabItem[] {
  const eventHorizon = getProjectById("event-horizon")!;
  const novatech = getProjectById("novatech-solutions")!;
  const taskflow = getProjectById("taskflow")!;
  const starlenz = getProjectById("starlenz")!;
  const toolkit = getProjectById("kilo-toolkit")!;

  return [
    fromProject(eventHorizon, {
      state: "live-demo",
      description: "Browse events and hold tickets. External listings open the provider.",
    }),
    fromProject(taskflow, {
      title: "TaskFlow",
      state: "live-demo",
      description: "Authenticated React workspace with seeded demo data.",
    }),
    {
      id: "taskflow-angular",
      title: "TaskFlow Angular",
      description:
        "Second client against the same APIs, rebuilt to learn Angular before a full application. Not production-deployed.",
      state: "experiment",
      href: "/projects/taskflow",
      github:
        "https://github.com/christopherkilo/portfolio/tree/main/taskflow-angular",
    },
    fromProject(novatech, {
      state: "production-verified",
      description:
        "Fictional MSP site. The inquiry workflow was verified in production.",
    }),
    fromProject(starlenz, {
      state: "active-development",
      description: "Interactive astronomy experience. Documented on the blog; no public demo yet.",
      liveHref: undefined,
    }),
    fromProject(toolkit, {
      state: "demo",
      description:
        "Diagnostics and guided troubleshooting with illustrative data. It does not read this device.",
    }),
  ];
}
