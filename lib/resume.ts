/**
 * Resume page content — sourced from the current professional PDF.
 * Keep this aligned with `public/Christopher_Kilo_Resume.pdf`.
 */

export const resumeMeta = {
  name: "Christopher Kilo",
  headline: "Full-Stack Developer",
  location: "DeSoto, TX",
  summary:
    "I build responsive web apps that pair clean interfaces with practical backend architecture—Next.js, React, TypeScript, PostgreSQL, Prisma, and Supabase. CompTIA A+ certified, with an IT and design background that keeps troubleshooting and UX in the same toolkit.",
} as const;

export const resumeSkillGroups = [
  {
    label: "Frontend",
    skills: ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "Framer Motion"],
  },
  {
    label: "Backend / Data",
    skills: ["PostgreSQL", "Prisma", "Supabase", "Auth.js", "REST APIs", "Zod"],
  },
  {
    label: "Design & Tools",
    skills: ["UI/UX", "Figma", "Git", "GitHub", "VS Code"],
  },
  {
    label: "IT",
    skills: [
      "CompTIA A+",
      "PC diagnostics",
      "Hardware repair",
      "Networking fundamentals",
      "Technical support",
    ],
  },
] as const;

/** Three strongest web projects — brief differentiators, not case-study dumps. */
export const resumeProjects = [
  {
    id: "event-horizon",
    title: "Event Horizon",
    href: "/projects/event-horizon",
    summary:
      "Event discovery with Auth.js, PostgreSQL, and transactional ticket holds—idempotent reservations and inventory that cannot go negative.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Auth.js"],
  },
  {
    id: "novatech-solutions",
    title: "NovaTech Solutions",
    href: "/projects/novatech-solutions",
    summary:
      "Managed-IT marketing site with a real lead path: validation, Turnstile, HubSpot, and Resend—built for conversion, not just polish.",
    technologies: ["Next.js", "TypeScript", "HubSpot", "Resend"],
  },
  {
    id: "taskflow",
    title: "TaskFlow",
    href: "/projects/taskflow",
    summary:
      "Collaborative workspace on Supabase with RLS, conflict detection, realtime invalidation, and an offline mutation outbox.",
    technologies: ["Next.js", "TypeScript", "Supabase", "TanStack Query"],
  },
] as const;

export const resumeExperience = [
  {
    role: "Customer Service Representative",
    employer: "Circle K",
    dates: "Aug 2022 – Nov 2023",
    summary:
      "Supported customers in a high-volume retail environment—resolving issues quickly, balancing priorities, and collaborating to keep service quality high.",
  },
] as const;

export const resumeEducation = [
  {
    school: "Davis Technical College",
    credential: "Web & Graphic Design",
    dates: "May 2026",
  },
  {
    school: "Clearfield Job Corps Center",
    credential: "Computer Technician Program",
    dates: "June 2025",
  },
] as const;

export const resumeCertifications = [
  { name: "CompTIA A+", highlight: true },
  { name: "Web and Graphic Design", highlight: false },
  { name: "Introduction to Telecommunications", highlight: false },
  {
    name: "Introduction to Network Cabling (Copper-Based Systems)",
    highlight: false,
  },
] as const;
