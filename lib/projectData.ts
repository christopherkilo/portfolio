export type ProjectCategory = "web" | "design" | "it";

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  technologies: string[];
  image: string;
  imageAlt?: string;
  github?: string;
  /**
   * Internal live-demo path (e.g. `/demos/event-horizon`) or a public HTTPS URL.
   * Never use localhost for visitor-facing links.
   */
  liveDemo?: string;
  featured: boolean;
  /** Internal case-study (or toolkit) route. */
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
    liveDemo: "/demos/event-horizon",
    featured: true,
    href: "/projects/event-horizon",
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
    liveDemo: "/demos/novatech-solutions",
    featured: false,
    href: "/projects/novatech-solutions",
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
    liveDemo: "/demos/taskflow",
    featured: false,
    href: "/projects/taskflow",
  },
  {
    id: "voltline",
    title: "Voltline",
    category: "design",
    description:
      "A complete brand identity for a premium technology-accessories company—logo system, typography, packaging, and campaign applications.",
    technologies: [
      "Brand Strategy",
      "Logo Design",
      "Typography",
      "Packaging",
      "Visual Systems",
    ],
    image: "/projects/voltline/cover.svg",
    imageAlt: "Voltline brand identity cover with mark, wordmark, and system tiles",
    featured: false,
    href: "/projects/voltline",
  },
  {
    id: "nightshift",
    title: "NightShift",
    category: "design",
    description:
      "An integrated campaign for a nighttime festival combining art, technology, music, and immersive media.",
    technologies: [
      "Art Direction",
      "Campaign Design",
      "Typography",
      "Advertising",
      "Motion Design",
    ],
    image: "/projects/nightshift/cover.svg",
    imageAlt: "NightShift festival campaign cover with Create after dark lockup",
    featured: false,
    href: "/projects/nightshift",
  },
  {
    id: "signal-magazine",
    title: "Signal Magazine",
    category: "design",
    description:
      "An editorial publication exploring the relationship between people, creativity, and technology.",
    technologies: [
      "Editorial Design",
      "Typography",
      "Grid Systems",
      "Art Direction",
      "Information Design",
    ],
    image: "/projects/signal-magazine/cover.svg",
    imageAlt: "Signal Magazine Issue 01 Human / Machine editorial cover",
    featured: false,
    href: "/projects/signal-magazine",
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

/** One representative project from each discipline for the homepage carousel. */
export function getHomepageFeaturedProjects(): Project[] {
  const categories: ProjectCategory[] = ["web", "design", "it"];
  return categories.map((category) => {
    const inCategory = projects.filter((project) => project.category === category);
    return inCategory.find((project) => project.featured) ?? inCategory[0];
  });
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

/** Internal app paths (case studies, demos, toolkit). */
export function isInternalHref(url: string | undefined): url is string {
  return Boolean(url && url.startsWith("/") && !url.startsWith("//"));
}

/**
 * True only for visitor-safe public HTTPS demo URLs.
 * Rejects localhost, loopback, and .local hosts.
 */
export function isPublicLiveDemoUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return false;
    }
    return Boolean(host);
  } catch {
    return false;
  }
}

/** True when a liveDemo value can be shown to visitors (internal path or public HTTPS). */
export function hasLiveDemo(url: string | undefined): url is string {
  return isInternalHref(url) || isPublicLiveDemoUrl(url);
}

export function isExternalHref(url: string | undefined): boolean {
  if (!url) return false;
  return !isInternalHref(url);
}
