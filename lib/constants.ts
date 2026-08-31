export const SITE = {
  name: "Christopher Kilo",
  title: "Full-Stack Developer",
  tagline:
    "Full-stack developer specializing in modern web applications, business automation, collaborative software, and IT tools.",
  description:
    "Christopher Kilo is a full-stack developer specializing in modern web applications, business automation, collaborative software, and IT tools built with React, Next.js, TypeScript, PostgreSQL, Supabase, and AWS.",
  email: "christopherkilo.pro@gmail.com",
  linkedin: "https://www.linkedin.com/in/christopher-kilo-312467425/",
  github: "https://github.com/christopherkilo",
  /** Public resume PDF path (served from /public). */
  resume: "/Christopher_Kilo_Resume.pdf",
  /** Suggested download filename for the resume PDF. */
  resumeFileName: "Christopher_Kilo_Resume.pdf",
  resumeUpdatedLabel: "Updated August 2026",
  url: "https://www.christopherkilo.com",
  copyright: `© ${new Date().getFullYear()} Christopher Kilo. All rights reserved.`,
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home", id: "home" },
  { href: "/projects", label: "Projects", id: "projects" },
  { href: "/blog", label: "Blog", id: "blog" },
  { href: "/about", label: "About", id: "about" },
  { href: "/resume", label: "Resume", id: "resume" },
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
