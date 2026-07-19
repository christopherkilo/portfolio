export const SITE = {
  name: "Alex Rivera",
  title: "Developer · Designer · IT Professional",
  tagline:
    "I build refined digital products, craft intentional visuals, and keep systems running with quiet precision.",
  email: "hello@alexrivera.dev",
  linkedin: "https://linkedin.com/in/alexrivera",
  github: "https://github.com/alexrivera",
  resume: "/resume.pdf",
  copyright: `© ${new Date().getFullYear()} Alex Rivera. All rights reserved.`,
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home", id: "home" },
  { href: "/projects", label: "Projects", id: "projects" },
  { href: "/lab", label: "Technical Lab", id: "lab" },
  { href: "/about", label: "About", id: "about" },
  { href: "/contact", label: "Contact", id: "contact" },
] as const;

export const HOME_SECTIONS = [
  { href: "/#projects", label: "Projects" },
  { href: "/#lab", label: "Technical Lab" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
] as const;

export const TECH_BADGES = [
  "Next.js",
  "TypeScript",
  "Tailwind",
  "JavaScript",
  "CompTIA A+",
  "Networking",
  "Graphic Design",
  "HTML",
  "CSS",
  "Git",
  "Framer Motion",
] as const;

export const ROLES = [
  {
    id: "developer",
    title: "Developer",
    description:
      "Full-stack interfaces with clean architecture, thoughtful motion, and production-grade performance.",
    icon: "Code2" as const,
  },
  {
    id: "designer",
    title: "Designer",
    description:
      "Visual systems, brand assets, and layouts that feel intentional rather than templated.",
    icon: "Palette" as const,
  },
  {
    id: "technician",
    title: "IT Technician",
    description:
      "Hardware diagnostics, deployments, and network troubleshooting with methodical problem-solving.",
    icon: "Cpu" as const,
  },
] as const;

export const LAB_CASE_STUDIES = [
  {
    id: "pc-build",
    title: "Custom PC Build",
    summary:
      "Component selection, cable management, BIOS tuning, and thermal validation for a quiet workstation.",
    tags: ["Hardware", "Assembly", "Thermals"],
  },
  {
    id: "windows-deploy",
    title: "Windows Deployment",
    summary:
      "Image preparation, driver packs, Autopilot-style provisioning, and post-deploy hardening.",
    tags: ["OS", "Imaging", "MDM"],
  },
  {
    id: "networking",
    title: "Small Office Network",
    summary:
      "VLAN segmentation, DNS hygiene, secure Wi-Fi, and documented failover for a 20-seat office.",
    tags: ["LAN", "Security", "Docs"],
  },
  {
    id: "hardware-repair",
    title: "Hardware Repair",
    summary:
      "Board-level triage, storage recovery, and parts replacement with clear client communication.",
    tags: ["Repair", "Diagnostics"],
  },
  {
    id: "diagnostics",
    title: "System Diagnostics",
    summary:
      "Event log analysis, SMART checks, memory testing, and root-cause reports that stick.",
    tags: ["Logs", "RCA", "Testing"],
  },
] as const;
