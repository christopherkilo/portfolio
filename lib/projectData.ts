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
  /**
   * When false, kept for deep links / toolkit modules but omitted from
   * homepage featured + Projects page grids.
   */
  portfolioVisible?: boolean;
}

export const projects: Project[] = [
  {
    id: "event-horizon",
    title: "Event Horizon",
    category: "web",
    description:
      "Consumer event platform with authentication, reservations, and PostgreSQL-backed persistence.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Auth.js"],
    image: "/projects/event-horizon-logo.svg",
    imageAlt:
      "Event Horizon portfolio cover with a supporting black-hole mark above a fully readable title",
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
      "Business website integrating HubSpot CRM, automated inquiries, email delivery, and spam protection.",
    technologies: ["Next.js", "TypeScript", "HubSpot", "Resend"],
    image: "/projects/novatech-logo.svg",
    imageAlt:
      "NovaTech Solutions portfolio cover with indigo enterprise mark and wordmark",
    github: "https://github.com/christopherkilo/novatech-solutions",
    liveDemo: "/demos/novatech-solutions",
    featured: true,
    href: "/projects/novatech-solutions",
  },
  {
    id: "taskflow",
    title: "TaskFlow",
    category: "web",
    description:
      "Collaborative SaaS platform featuring realtime updates, Row Level Security, conflict detection, and offline-aware collaboration.",
    technologies: ["Next.js", "TypeScript", "Supabase", "TanStack Query"],
    image: "/projects/taskflow-logo.svg",
    imageAlt:
      "TaskFlow portfolio cover with green workflow mark and collaborative project management lockup",
    github: "https://github.com/christopherkilo/taskflow",
    liveDemo: "/demos/taskflow",
    featured: true,
    href: "/projects/taskflow",
  },
  {
    id: "kilo-toolkit",
    title: "Kilo Toolkit",
    category: "it",
    description:
      "IT diagnostics and troubleshooting toolkit providing practical utilities for hardware, networking, and system analysis.",
    technologies: ["Next.js", "TypeScript", "Diagnostics", "Networking"],
    image: "/projects/kilo-toolkit.svg",
    imageAlt: "Kilo Toolkit diagnostics suite cover",
    github: "https://github.com/christopherkilo/portfolio",
    liveDemo: "/toolkit",
    featured: true,
    href: "/toolkit",
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
  // Toolkit module deep-links (not listed as separate portfolio cards)
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
    portfolioVisible: false,
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
    portfolioVisible: false,
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
    portfolioVisible: false,
  },
];

export const categoryLabels: Record<ProjectCategory, string> = {
  web: "Featured Applications",
  design: "Graphic Design",
  it: "Professional Toolkit",
};

/** Shorter labels for case-study badges and metadata (not section titles). */
export const categoryBadgeLabels: Record<ProjectCategory, string> = {
  web: "Web Application",
  design: "Graphic Design",
  it: "Professional Toolkit",
};

export const categoryDescriptions: Record<ProjectCategory, string> = {
  web: "A collection of full-stack applications demonstrating consumer software, business automation, and collaborative systems.",
  design:
    "A selection of branding, visual identity, and design projects demonstrating creative problem solving.",
  it: "Practical utilities built for IT diagnostics, troubleshooting, and everyday technical workflows.",
};

/** Homepage Featured Applications intro — covers all four software products. */
export const HOMEPAGE_FEATURED_DESCRIPTION =
  "Four complete software applications demonstrating consumer platforms, business automation, collaborative systems, and professional IT utilities.";

function isPortfolioVisible(project: Project): boolean {
  return project.portfolioVisible !== false;
}

/** Projects shown on homepage featured + Projects page grids. */
export function getPortfolioProjects(): Project[] {
  return projects.filter(isPortfolioVisible);
}

export function getFeaturedProject(): Project {
  return (
    getPortfolioProjects().find((p) => p.featured) ??
    getPortfolioProjects()[0] ??
    projects[0]
  );
}

/**
 * Homepage featured strip — Event Horizon, NovaTech, TaskFlow, and Kilo Toolkit.
 */
export function getHomepageFeaturedProjects(): Project[] {
  const web = getPortfolioProjectsByCategory("web");
  const toolkit = getHomepageToolkitProject();
  return toolkit ? [...web, toolkit] : web;
}

/** Portfolio-visible Kilo Toolkit card for dedicated sections. */
export function getHomepageToolkitProject(): Project | undefined {
  return getPortfolioProjects().find((project) => project.id === "kilo-toolkit");
}

export function getProjectsByCategory(category: ProjectCategory): Project[] {
  return projects.filter((p) => p.category === category);
}

/** Category filter limited to portfolio-visible cards. */
export function getPortfolioProjectsByCategory(
  category: ProjectCategory,
): Project[] {
  return getPortfolioProjects().filter((p) => p.category === category);
}

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getProjectHref(project: Project): string {
  return project.href ?? `/projects/${project.id}`;
}

export function getProjectCtaLabel(project: Project): string {
  if (
    project.id === "kilo-toolkit" ||
    project.category === "it" ||
    project.href?.startsWith("/toolkit")
  ) {
    return "Open Toolkit";
  }
  return "View Case Study";
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
