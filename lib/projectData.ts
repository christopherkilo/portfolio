export type ProjectCategory = "web" | "design" | "it";

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  technologies: string[];
  image: string;
  github: string;
  liveDemo: string;
  featured: boolean;
  href?: string;
}

export const projects: Project[] = [
  {
    id: "event-horizon",
    title: "Event Horizon",
    category: "web",
    description:
      "Premium event discovery platform with search, filters, favorites, featured carousel, and dynamic event detail pages.",
    technologies: ["Next.js", "TypeScript", "Tailwind", "Framer Motion"],
    image: "/projects/event-horizon-logo.svg",
    github: "https://github.com/christopherkilo/event-horizon",
    liveDemo: "http://localhost:3002",
    featured: true,
  },
  {
    id: "novatech-solutions",
    title: "NovaTech Solutions",
    category: "web",
    description:
      "Corporate MSP and IT consulting website with services, FAQ accordion, testimonials, and a professional contact experience.",
    technologies: ["Next.js", "TypeScript", "Tailwind", "Framer Motion"],
    image: "/projects/novatech-logo.svg",
    github: "https://github.com/christopherkilo/novatech-solutions",
    liveDemo: "http://localhost:3001",
    featured: false,
  },
  {
    id: "taskflow",
    title: "TaskFlow",
    category: "web",
    description:
      "Linear-inspired project management app with dashboard analytics, kanban board, calendar, team, and settings.",
    technologies: ["Next.js", "TypeScript", "Tailwind", "Framer Motion"],
    image: "/projects/taskflow-logo.svg",
    github: "https://github.com/christopherkilo/taskflow",
    liveDemo: "http://localhost:3003",
    featured: false,
  },
  {
    id: "northline-identity",
    title: "Northline Identity",
    category: "design",
    description:
      "Brand system for a logistics startup—wordmark, color logic, and modular collateral templates.",
    technologies: ["Figma", "Illustrator", "Brand Systems"],
    image: "/projects/northline-logo.svg",
    github: "https://github.com/christopherkilo/northline-identity",
    liveDemo: "https://northline.example.com",
    featured: false,
  },
  {
    id: "pulse-poster-series",
    title: "Pulse Poster Series",
    category: "design",
    description:
      "Limited-run poster set exploring rhythm, typography, and restrained neon accents for a music festival.",
    technologies: ["Photoshop", "Typography", "Print"],
    image: "/projects/pulse-logo.svg",
    github: "https://github.com/christopherkilo/pulse-posters",
    liveDemo: "https://pulse.example.com",
    featured: false,
  },
  {
    id: "orbit-ui-kit",
    title: "Orbit UI Kit",
    category: "design",
    description:
      "Component library visuals and documentation art direction for a developer tooling platform.",
    technologies: ["Figma", "Design Tokens", "Illustration"],
    image: "/projects/orbit-logo.svg",
    github: "https://github.com/christopherkilo/orbit-ui-kit",
    liveDemo: "https://orbit.example.com",
    featured: false,
  },
  {
    id: "systemscope",
    title: "SystemScope",
    category: "it",
    description:
      "Hardware inventory, live performance simulation, storage health, and diagnostic findings inside Kilo Toolkit.",
    technologies: ["Next.js", "TypeScript", "Hardware", "Diagnostics"],
    image: "/projects/systemscope.svg",
    github: "https://github.com/christopherkilo/portfolio",
    liveDemo: "/toolkit/system",
    featured: false,
    href: "/toolkit/system",
  },
  {
    id: "memorymedic",
    title: "MemoryMedic",
    category: "it",
    description:
      "Memory timelines, process analysis, findings, and workload-aware RAM guidance inside Kilo Toolkit.",
    technologies: ["TypeScript", "Recharts", "Memory", "Troubleshooting"],
    image: "/projects/memorymedic.svg",
    github: "https://github.com/christopherkilo/portfolio",
    liveDemo: "/toolkit/memory",
    featured: false,
    href: "/toolkit/memory",
  },
  {
    id: "netcheck",
    title: "NetCheck",
    category: "it",
    description:
      "Connection testing, adapter inspection, DNS comparison, device mapping, and guided network troubleshooting.",
    technologies: ["TypeScript", "Networking", "DNS", "Decision Trees"],
    image: "/projects/netcheck.svg",
    github: "https://github.com/christopherkilo/portfolio",
    liveDemo: "/toolkit/network",
    featured: false,
    href: "/toolkit/network",
  },
];

export const categoryLabels: Record<ProjectCategory, string> = {
  web: "Web Projects",
  design: "Graphic Design Projects",
  it: "Kilo Toolkit",
};

export const categoryDescriptions: Record<ProjectCategory, string> = {
  web: "Product interfaces and web apps with polish, performance, and maintainable architecture.",
  design: "Brand systems, visual narratives, and design artifacts with a quiet premium finish.",
  it: "One cohesive diagnostics suite for system health, memory analysis, network testing, and guided troubleshooting.",
};

export function getFeaturedProject(): Project {
  return projects.find((p) => p.featured) ?? projects[0];
}

export function getProjectsByCategory(category: ProjectCategory): Project[] {
  return projects.filter((p) => p.category === category);
}

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getProjectHref(project: Project): string {
  return project.href ?? `/projects/${project.id}`;
}
