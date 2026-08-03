export const SITE = {
  name: "Christopher Kilo",
  title: "Full-Stack Developer",
  tagline:
    "Full-stack developer specializing in modern web applications, business automation, collaborative software, and IT tools.",
  description:
    "Christopher Kilo is a full-stack developer specializing in modern web applications, business automation, collaborative software, and IT tools built with React, Next.js, TypeScript, PostgreSQL, and Supabase.",
  email: "christopherkilo.pro@gmail.com",
  linkedin: "https://linkedin.com/in/christopherkilo",
  github: "https://github.com/christopherkilo",
  resume: "/resume.pdf",
  url: "https://christopherkilo.dev",
  copyright: `© ${new Date().getFullYear()} Christopher Kilo. All rights reserved.`,
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home", id: "home" },
  { href: "/projects", label: "Projects", id: "projects" },
  { href: "/about", label: "About", id: "about" },
  { href: "/contact", label: "Contact", id: "contact" },
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
