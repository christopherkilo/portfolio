import type { Project } from "@/lib/projectData";
import { getProjectById, projects } from "@/lib/projectData";
import { eventHorizonStudy } from "@/lib/case-studies/event-horizon";
import { novatechSolutionsStudy } from "@/lib/case-studies/novatech-solutions";
import { taskflowStudy } from "@/lib/case-studies/taskflow";
import type { CaseStudy } from "@/lib/case-studies/types";

export type {
  ArchitectureHighlight,
  ArchitectureLane,
  CaseStudy,
  CaseStudyChart,
  ChartPoint,
  TechGroup,
} from "@/lib/case-studies/types";

/** Active portfolio case studies only — no legacy placeholder entries. */
const studies: Record<string, Omit<CaseStudy, "projectId">> = {
  "event-horizon": eventHorizonStudy,
  "novatech-solutions": novatechSolutionsStudy,
  taskflow: taskflowStudy,
};

export function getCaseStudy(
  projectId: string,
): (CaseStudy & { project: Project }) | null {
  const project = getProjectById(projectId);
  const study = studies[projectId];
  if (!project || !study) return null;
  return { projectId, project, ...study };
}

export function getAllCaseStudyIds(): string[] {
  return projects
    .filter((project) => Boolean(studies[project.id]))
    .map((project) => project.id);
}
