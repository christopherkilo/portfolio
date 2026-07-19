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
}

export const projects: Project[] = [
  {
    id: "aurora-dashboard",
    title: "Aurora Analytics",
    category: "web",
    description:
      "A real-time analytics dashboard with calm data density, keyboard shortcuts, and responsive charting.",
    technologies: ["Next.js", "TypeScript", "Recharts", "Tailwind"],
    image: "/projects/aurora.svg",
    github: "https://github.com/alexrivera/aurora-analytics",
    liveDemo: "https://aurora.example.com",
    featured: true,
  },
  {
    id: "folio-commerce",
    title: "Folio Commerce",
    category: "web",
    description:
      "Headless storefront focused on fast product discovery, accessible checkout, and editorial merchandising.",
    technologies: ["Next.js", "Stripe", "Sanity", "Framer Motion"],
    image: "/projects/folio.svg",
    github: "https://github.com/alexrivera/folio-commerce",
    liveDemo: "https://folio.example.com",
    featured: false,
  },
  {
    id: "signal-board",
    title: "Signal Board",
    category: "web",
    description:
      "Collaborative status board for incident response with live presence and structured postmortems.",
    technologies: ["React", "Node.js", "WebSockets", "PostgreSQL"],
    image: "/projects/signal.svg",
    github: "https://github.com/alexrivera/signal-board",
    liveDemo: "https://signal.example.com",
    featured: false,
  },
  {
    id: "northline-identity",
    title: "Northline Identity",
    category: "design",
    description:
      "Brand system for a logistics startup—wordmark, color logic, and modular collateral templates.",
    technologies: ["Figma", "Illustrator", "Brand Systems"],
    image: "/projects/northline.svg",
    github: "https://github.com/alexrivera/northline-identity",
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
    image: "/projects/pulse.svg",
    github: "https://github.com/alexrivera/pulse-posters",
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
    image: "/projects/orbit.svg",
    github: "https://github.com/alexrivera/orbit-ui-kit",
    liveDemo: "https://orbit.example.com",
    featured: false,
  },
  {
    id: "edge-lab-network",
    title: "Edge Lab Network",
    category: "it",
    description:
      "Segmented lab network with monitored switches, documented VLANs, and repeatable restore procedures.",
    technologies: ["Networking", "VLAN", "Monitoring"],
    image: "/projects/edge.svg",
    github: "https://github.com/alexrivera/edge-lab",
    liveDemo: "https://edge.example.com",
    featured: false,
  },
  {
    id: "fleet-image-pipeline",
    title: "Fleet Image Pipeline",
    category: "it",
    description:
      "Automated Windows imaging pipeline reducing workstation setup from hours to under twenty minutes.",
    technologies: ["MDT", "PowerShell", "Drivers"],
    image: "/projects/fleet.svg",
    github: "https://github.com/alexrivera/fleet-image",
    liveDemo: "https://fleet.example.com",
    featured: false,
  },
  {
    id: "bench-diagnostics",
    title: "Bench Diagnostics Suite",
    category: "it",
    description:
      "Standardized hardware triage checklists and tooling notes for rapid no-POST and storage failures.",
    technologies: ["Hardware", "Diagnostics", "Documentation"],
    image: "/projects/bench.svg",
    github: "https://github.com/alexrivera/bench-diagnostics",
    liveDemo: "https://bench.example.com",
    featured: false,
  },
];

export const categoryLabels: Record<ProjectCategory, string> = {
  web: "Web Projects",
  design: "Graphic Design Projects",
  it: "IT Projects",
};

export const categoryDescriptions: Record<ProjectCategory, string> = {
  web: "Product interfaces and web apps with polish, performance, and maintainable architecture.",
  design: "Brand systems, visual narratives, and design artifacts with a quiet premium finish.",
  it: "Infrastructure, deployments, and hands-on systems work documented with clarity.",
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
