export const SITE = {
  name: "Christopher Kilo",
  title: "Software Engineer",
  disciplines: [
    "Full-Stack Development",
    "Cloud / IT",
    "Graphic Design",
  ] as const,
  description:
    "Christopher Kilo is a software engineer building full-stack applications, cloud-backed systems, and interactive digital experiences, with additional experience in IT and graphic design.",
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
    title: "Full-Stack Development",
    description:
      "Frontend applications, backend APIs, and application architecture with testing and reliability in the same toolkit.",
    icon: "Code2" as const,
  },
  {
    id: "designer",
    title: "Graphic Design",
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
