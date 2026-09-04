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
  /** Optional visitor-facing note when GitHub points at this portfolio monorepo. */
  githubNote?: string;
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
  /** Honest in-progress marker. Not a general status system. */
  inDevelopment?: boolean;
  /**
   * Compact proof line for cards (2–4 facts). Architectural evidence only —
   * never invented traffic, revenue, uptime, or unverified counts.
   */
  proofPoints?: string[];
  /**
   * Homepage / Featured Applications cards only. Max two facts.
   * Full `proofPoints` stay available for other surfaces.
   */
  featuredProofPoints?: string[];
}

export const projects: Project[] = [
  {
    id: "event-horizon",
    title: "Event Horizon",
    category: "web",
    description:
      "Full-stack event discovery with PostgreSQL reservations and an AWS pipeline that ingests real Ticketmaster listings.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "AWS"],
    image: "/projects/event-horizon-logo.svg",
    imageAlt:
      "Event Horizon portfolio cover with a supporting black-hole mark above a fully readable title",
    github:
      "https://github.com/christopherkilo/portfolio/tree/main/app/demos/event-horizon",
    githubNote: "Source: portfolio monorepo",
    liveDemo: "/demos/event-horizon",
    featured: true,
    href: "/projects/event-horizon",
    proofPoints: [
      "AWS CDK ingestion pipeline",
      "SQS + DLQ",
      "Idempotent DynamoDB writes",
      "Playwright QA",
    ],
    featuredProofPoints: [
      "AWS CDK ingestion · SQS + DLQ",
      "Idempotent DynamoDB writes",
    ],
  },
  {
    id: "novatech-solutions",
    title: "NovaTech Solutions",
    category: "web",
    description:
      "Managed-IT marketing site with a real inquiry workflow: Turnstile, Step Functions, HubSpot, and asynchronous Resend.",
    technologies: ["Next.js", "TypeScript", "HubSpot", "AWS"],
    image: "/projects/novatech-logo.svg",
    imageAlt:
      "NovaTech Solutions portfolio cover with indigo enterprise mark and wordmark",
    github: "https://github.com/christopherkilo/novatech-solutions",
    liveDemo: "/demos/novatech-solutions",
    featured: true,
    href: "/projects/novatech-solutions",
    proofPoints: [
      "OIDC-authenticated AWS workflow",
      "Step Functions verified",
      "HubSpot CRM completed",
      "Turnstile at ingress",
    ],
    featuredProofPoints: [
      "OIDC-authenticated AWS workflow",
      "Step Functions + CRM verified",
    ],
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
    proofPoints: [
      "React + Angular clients",
      "Realtime collaboration",
      "Offline mutation queue",
      "Optimistic concurrency",
    ],
    featuredProofPoints: [
      "React + Angular clients",
      "Offline queue + optimistic concurrency",
    ],
  },
  {
    id: "starlenz",
    title: "StarLenz",
    category: "web",
    description:
      "An interactive astronomy experience that started as a graphic design concept. The case study is still being written.",
    technologies: ["Next.js", "TypeScript", "UI/UX", "Motion Design"],
    image: "",
    imageAlt: "StarLenz gold lens mark on a navy star field",
    featured: false,
    href: "/projects/starlenz",
    inDevelopment: true,
    proofPoints: [
      "Interactive astronomy UI",
      "Custom constellations",
      "Motion system",
    ],
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
    github: "https://github.com/christopherkilo/portfolio/tree/main/app/toolkit",
    githubNote: "Source: portfolio monorepo",
    liveDemo: "/toolkit",
    featured: true,
    href: "/toolkit",
    proofPoints: [
      "Interactive diagnostics suite",
      "Guided troubleshooting",
      "Demo-mode data",
    ],
    featuredProofPoints: [
      "Guided troubleshooting",
      "Demo-mode data",
    ],
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
    proofPoints: ["Logo system", "Packaging", "Campaign applications"],
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
    proofPoints: ["Campaign art direction", "Typography", "Motion design"],
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
    proofPoints: ["Editorial design", "Grid systems", "Typography"],
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
    github: "https://github.com/christopherkilo/portfolio/tree/main/app/toolkit",
    githubNote: "Source: portfolio monorepo",
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
    github: "https://github.com/christopherkilo/portfolio/tree/main/app/toolkit",
    githubNote: "Source: portfolio monorepo",
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
    github: "https://github.com/christopherkilo/portfolio/tree/main/app/toolkit",
    githubNote: "Source: portfolio monorepo",
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

/** Explicit homepage carousel order — not inferred from category or `featured`. */
export const homepageFeaturedProjectIds = [
  "event-horizon",
  "novatech-solutions",
  "taskflow",
  "kilo-toolkit",
] as const;

function isPortfolioVisible(project: Project): boolean {
  return project.portfolioVisible !== false;
}

/** Portfolio-visible projects: All Work, command palette, and eligible project grids. */
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
  return homepageFeaturedProjectIds
    .map((id) => getProjectById(id))
    .filter((project): project is Project => Boolean(project));
}

export const FEATURED_PROOF_LIMIT = 2;

/**
 * Proof line for homepage / Featured Applications cards.
 * Keeps the full `proofPoints` list intact for other surfaces.
 */
export function getFeaturedCardProofPoints(project: Project): string[] {
  const source = project.featuredProofPoints ?? project.proofPoints ?? [];
  return source
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, FEATURED_PROOF_LIMIT);
}

/**
 * `/projects` Featured Applications grid — finished featured web work only.
 * In-development projects stay on All Work and Engineering Lab.
 */
export function getFeaturedApplicationProjects(): Project[] {
  return getPortfolioProjectsByCategory("web").filter(
    (project) => project.featured && !project.inDevelopment,
  );
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

export const PORTFOLIO_GITHUB_REPO =
  "https://github.com/christopherkilo/portfolio";

/**
 * Recruiter-facing status vocabulary. Each label means exactly one thing:
 * live-app — visitor can use the actual product
 * live-demo — functional public demonstration
 * production-verified — real production path was executed and checked
 * architecture-demo — real architecture without inviting public production use
 * case-study — documentation / engineering walkthrough
 * experiment — technical exploration
 * active-development — still being built
 * demo — illustrative / simulated surface
 */
export const PROJECT_STATUS_LABELS = {
  "live-app": "Live app",
  "live-demo": "Live demo",
  "production-verified": "Production verified",
  "architecture-demo": "Architecture demo",
  "case-study": "Case study",
  "experiment": "Experiment",
  "active-development": "Active development",
  demo: "Demo",
} as const;

export type ProjectStatusKind = keyof typeof PROJECT_STATUS_LABELS;

export function getProjectStatusKind(
  id: string,
  inDevelopment?: boolean,
): ProjectStatusKind {
  switch (id) {
    case "event-horizon":
    case "taskflow":
      return "live-demo";
    case "novatech-solutions":
      return "production-verified";
    case "starlenz":
      return "active-development";
    case "kilo-toolkit":
    case "systemscope":
    case "memorymedic":
    case "netcheck":
      return "demo";
    case "taskflow-angular":
      return "experiment";
    default:
      if (inDevelopment) return "active-development";
      return "case-study";
  }
}

export function getProjectStatusLabel(
  project: Pick<Project, "id" | "inDevelopment">,
): string {
  return PROJECT_STATUS_LABELS[
    getProjectStatusKind(project.id, project.inDevelopment)
  ];
}

/** Visitor-facing control that opens a public surface — not a status badge. */
export function getPublicSurfaceLinkLabel(id: string): string {
  const kind = getProjectStatusKind(id);
  if (kind === "production-verified" || kind === "architecture-demo" || kind === "demo") {
    return "Open demo";
  }
  return "Live Demo";
}

export function getPublicSurfaceCta(id: string): { title: string; body: string } {
  const kind = getProjectStatusKind(id);
  if (kind === "production-verified" || kind === "architecture-demo") {
    return {
      title: "Explore the public demo",
      body: "Open the demonstration site, then return here via the demo chrome or browser Back.",
    };
  }
  return {
    title: "Explore the live demo",
    body: "Open the demo, then return here anytime via the demo chrome or browser Back.",
  };
}

/** True when a GitHub URL is this site’s portfolio/monorepo, including subdirectory links. */
export function isPortfolioMonorepoGithub(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url === PORTFOLIO_GITHUB_REPO ||
    url.startsWith(`${PORTFOLIO_GITHUB_REPO}/`)
  );
}

export function githubControlLabel(
  project: Pick<Project, "title" | "github" | "githubNote">,
): string {
  if (isPortfolioMonorepoGithub(project.github)) {
    return project.githubNote
      ? `${project.title} on GitHub — ${project.githubNote}`
      : `${project.title} on GitHub — portfolio monorepo`;
  }
  return `${project.title} on GitHub`;
}
