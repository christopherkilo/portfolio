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
    id: "signal-board",
    title: "Signal Board",
    category: "web",
    description:
      "Collaborative status board for incident response with live presence and structured postmortems.",
    technologies: ["React", "Node.js", "WebSockets", "PostgreSQL"],
    image: "/projects/signal-logo.svg",
    github: "https://github.com/christopherkilo/signal-board",
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
    id: "edge-lab-network",
    title: "Edge Lab Network",
    category: "it",
    description:
      "Segmented lab network with monitored switches, documented VLANs, and repeatable restore procedures.",
    technologies: ["Networking", "VLAN", "Monitoring"],
    image: "/projects/edge-logo.svg",
    github: "https://github.com/christopherkilo/edge-lab",
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
    image: "/projects/fleet-logo.svg",
    github: "https://github.com/christopherkilo/fleet-image",
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
    image: "/projects/bench-logo.svg",
    github: "https://github.com/christopherkilo/bench-diagnostics",
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
