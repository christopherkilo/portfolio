import {
  categoryBadgeLabels,
  getPortfolioProjects,
  getProjectStatusLabel,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectCategory,
} from "@/lib/projectData";

export type WorkIndexItem = {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  technologies: string[];
  status: string;
  href: string;
  liveDemo?: string;
  github?: string;
};

export type WorkIndexGroup = {
  category: ProjectCategory;
  title: string;
  items: WorkIndexItem[];
};

const GROUP_TITLES: Record<ProjectCategory, string> = {
  web: "Web Development",
  it: "IT / Cloud",
  design: "Graphic Design",
};

const GROUP_ORDER: ProjectCategory[] = ["web", "it", "design"];

function fromProject(project: Project): WorkIndexItem {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category,
    technologies: project.technologies,
    status: getProjectStatusLabel(project),
    href: project.href ?? `/projects/${project.id}`,
    liveDemo: project.liveDemo,
    github: project.github,
  };
}

/** Angular client is listed separately; it is not a homepage carousel card. */
const TASKFLOW_ANGULAR_ROW: WorkIndexItem = {
  id: "taskflow-angular",
  title: "TaskFlow Angular",
  description:
    "A second TaskFlow client rebuilt in Angular to learn the framework before a full application. Same APIs; not the public demo.",
  category: "web",
  technologies: ["Angular", "TypeScript", "Signals", "Supabase"],
  status: PROJECT_STATUS_LABELS.experiment,
  href: "/projects/taskflow",
  github:
    "https://github.com/christopherkilo/portfolio/tree/main/taskflow-angular",
};

export function getWorkIndexGroups(): WorkIndexGroup[] {
  const projects = getPortfolioProjects().map(fromProject);
  const web = projects.filter((item) => item.category === "web");
  const taskflowIndex = web.findIndex((item) => item.id === "taskflow");
  const webWithAngular = [...web];
  webWithAngular.splice(taskflowIndex + 1, 0, TASKFLOW_ANGULAR_ROW);

  const byCategory: Record<ProjectCategory, WorkIndexItem[]> = {
    web: webWithAngular,
    it: projects.filter((item) => item.category === "it"),
    design: projects.filter((item) => item.category === "design"),
  };

  return GROUP_ORDER.map((category) => ({
    category,
    title: GROUP_TITLES[category],
    items: byCategory[category],
  })).filter((group) => group.items.length > 0);
}

export function workDetailsLabel(item: WorkIndexItem): string {
  if (item.href.startsWith("/toolkit")) return "Open toolkit";
  if (item.id === "starlenz") return "Project";
  return "Case study";
}

export function workCategoryBadge(category: ProjectCategory): string {
  return categoryBadgeLabels[category];
}
