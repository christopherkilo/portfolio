/**
 * Resume page content — sourced from the current professional PDF.
 * Keep this aligned with `public/Christopher_Kilo_Resume.pdf`
 * (regenerate via `python3 scripts/generate-resume-pdf.py`).
 */

export const resumeMeta = {
  name: "Christopher Kilo",
  headline: "Software Engineer | Full-Stack Developer | Cloud / IT | Graphic Designer",
  location: "DeSoto, TX",
  summary:
    "I build responsive web apps that pair clean interfaces with practical backend architecture—Next.js, React, TypeScript, PostgreSQL, Prisma, Supabase, and AWS. CompTIA A+ certified, with an IT and design background (Adobe Photoshop and Illustrator) that keeps troubleshooting and UX in the same toolkit.",
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
    label: "Cloud / AWS",
    skills: ["CDK", "ECS/Fargate", "Lambda", "SQS", "DynamoDB", "EventBridge", "Step Functions"],
  },
  {
    label: "Design & Tools",
    skills: ["UI/UX", "Figma", "Photoshop", "Illustrator", "Git", "GitHub", "VS Code"],
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
      "Full-stack event product with Auth.js, Prisma, and PostgreSQL for users, favorites, inventory, and transactional ticket holds so reservations cannot go negative. A separate AWS path (Docker on Fargate, SQS, Lambda, DynamoDB, EventBridge) ingests real Ticketmaster listings twice a day; those cards are discovery-only and never enter checkout.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "AWS"],
  },
  {
    id: "novatech-solutions",
    title: "NovaTech Solutions",
    href: "/projects/novatech-solutions",
    summary:
      "Grew a same-origin contact form into a durable inquiry workflow: Cloudflare Turnstile and Zod at Next.js ingress, then Vercel OIDC with a StartExecution-only IAM role. Step Functions claims the submission in DynamoDB, a Lambda writes HubSpot (contact, deal, note), and SQS plus Resend send mail at-least-once so email failure cannot roll back the CRM lead.",
    technologies: ["Next.js", "TypeScript", "HubSpot", "AWS"],
  },
  {
    id: "taskflow",
    title: "TaskFlow",
    href: "/projects/taskflow",
    summary:
      "Collaborative workspace with Google OAuth, Postgres, and row-level security so workspaces stay isolated. Optimistic edits use an expectedVersion conflict check (409 + dialog), TanStack Query plus Supabase realtime for cache invalidation, and an IndexedDB outbox that replays mutations when the network returns.",
    technologies: ["Next.js", "TypeScript", "Supabase", "TanStack Query"],
  },
] as const;

export const resumeExperience = [
  {
    role: "Customer Service Representative",
    employer: "Circle K",
    location: "Prosper, TX",
    dates: "Aug 2022 – Nov 2023",
    summary:
      "Supported customers in a high-volume retail environment—resolving issues quickly, balancing priorities, and collaborating to keep service quality high.",
  },
] as const;

export const resumeEducation = [
  {
    school: "Davis Technical College",
    location: "Kaysville, UT",
    credential: "Web & Graphic Design",
    dates: "July 2025 – May 2026",
  },
  {
    school: "Clearfield Job Corps Center",
    location: "Clearfield, UT",
    credential: "Computer Technician Program",
    dates: "August 2024 – June 2025",
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
