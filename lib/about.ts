/**
 * About page narrative content.
 *
 * Education and certification titles, dates, and institutions must come from
 * `lib/resume.ts` (the resume/PDF source of truth). Do not invent programs,
 * certificate names, credential IDs, honors, or a Google AI title here.
 */

import { ROLES, SITE } from "@/lib/constants";
import { getProjectById, getProjectHref } from "@/lib/projectData";
import {
  resumeCertifications,
  resumeEducation,
} from "@/lib/resume";

export const ABOUT_PORTRAIT_SRC = "/about/portrait.webp";

export const ABOUT_THESIS =
  "When I encounter something I don't know, I know how to learn it.";

/** Reserved project id for a future Prompt Engineering case study CTA. */
export const PROMPT_ENGINEERING_PROJECT_ID = "prompt-engineering";

export const aboutHero = {
  eyebrow: "About",
  title: `Hi, I'm ${SITE.name}.`,
  lead: "I'm a software engineer and full-stack developer working across frontend applications, backend systems, cloud infrastructure, IT, and graphic design.",
  supporting: [
    "I learn primarily by building—taking unfamiliar problems apart, understanding the systems behind them, and developing the knowledge necessary to solve them.",
    "When a system is unfamiliar, I start with the problem it needs to solve, then learn what the work actually requires.",
    "The sections below follow that path: how the training started, and how the projects kept teaching the rest.",
  ],
} as const;

export const aboutPath = {
  eyebrow: "My Path",
  title: "Self-Taught by Building",
  opening:
    "My path into software engineering hasn't followed a traditional four-year computer science degree program. It began with formal career and technical education and continued through independent learning driven by real projects.",
  foundation:
    "Through Job Corps and Davis Technical College, I built an early foundation in technology, IT, web development, and design. From there, the projects I wanted to build began demanding skills I hadn't learned yet.",
  emphasis: "So I learned them.",
  progression:
    "Modern frontend frameworks led into backend systems. Backend systems led into authentication, databases, and APIs. Deployments led into cloud infrastructure and CI/CD. Larger applications introduced testing, accessibility, concurrency, distributed workflows, system architecture, and production debugging.",
  independent:
    "Much of that knowledge was developed independently through documentation, experimentation, debugging, and building systems complex enough to expose gaps in my understanding.",
  method:
    "I learn best when technology has a purpose: understand the problem, learn what the system requires, build it, test it, break it, understand why it broke, and improve it.",
} as const;

export const aboutEducationIntro = {
  eyebrow: "Education & Credentials",
  title: "A technical foundation, built beyond the classroom.",
} as const;

const EDUCATION_SUMMARIES: Record<string, string> = {
  "Davis Technical College":
    "Formal technical and career education in web development and graphic design.",
  "Clearfield Job Corps Center":
    "Career and technical training in computer technician work, IT systems, and related troubleshooting.",
};

const CERTIFICATION_SUMMARIES: Record<string, string> = {
  "CompTIA A+":
    "Industry credential covering foundational IT hardware, operating systems, troubleshooting, networking, security, and technical support concepts.",
  "Web and Graphic Design":
    "Formal training and certification representing an early foundation in web and visual design.",
  "Introduction to Telecommunications":
    "Foundational technical training in telecommunications concepts.",
  "Introduction to Network Cabling (Copper-Based Systems)":
    "Technical training in copper-based network cabling systems.",
};

export type AboutEducationEntry = {
  school: string;
  location: string;
  credential: string;
  dates: string;
  summary: string;
};

export type AboutCertificationEntry = {
  name: string;
  highlight: boolean;
  summary: string;
};

export function getAboutEducation(): AboutEducationEntry[] {
  return resumeEducation.map((item) => ({
    school: item.school,
    location: item.location,
    credential: item.credential,
    dates: item.dates,
    summary: EDUCATION_SUMMARIES[item.school] ?? item.credential,
  }));
}

export function getAboutCertifications(): AboutCertificationEntry[] {
  return resumeCertifications.map((item) => ({
    name: item.name,
    highlight: item.highlight,
    summary: CERTIFICATION_SUMMARIES[item.name] ?? item.name,
  }));
}

export const aboutLearning = {
  eyebrow: "Continuous Learning",
  title: "The project usually tells me what I need to learn next.",
  intro:
    "Formal training gave me a foundation. The applications I wanted to ship kept expanding that curriculum—each build introducing a system I had to understand before I could finish the work.",
} as const;

/**
 * Grouped from portfolio/resume evidence, not an exhaustive skill dump.
 * Applications includes Angular because TaskFlow ships a second client.
 */
export const aboutLearningClusters = [
  {
    label: "Applications",
    items: ["React", "Next.js", "Angular", "TypeScript"],
  },
  {
    label: "Systems",
    items: ["APIs", "Authentication", "PostgreSQL", "Supabase", "Prisma"],
  },
  {
    label: "Cloud & Delivery",
    items: ["AWS", "Infrastructure", "CI/CD", "Distributed Workflows"],
  },
  {
    label: "Quality",
    items: ["Testing", "Playwright", "Accessibility", "Production Debugging"],
  },
] as const;

export const aboutAI = {
  eyebrow: "AI-Assisted Engineering",
  title: "Using AI to learn faster without outsourcing understanding.",
  paragraphs: [
    "AI has become part of how I learn and build, but not as a replacement for understanding the work.",
    "I use AI to explore unfamiliar concepts, challenge architectural decisions, develop implementation plans, review code, identify failure modes, create test strategies, and translate broad requirements into concrete engineering tasks.",
    "Over time, that evolved into a structured workflow built around context, constraints, acceptance criteria, regression protection, and validation.",
    "The goal isn't simply to make an AI generate more code. It's to reduce ambiguity, understand the decisions being made, and verify that the resulting system actually works.",
  ],
  caseStudyLabel: "Read the Prompt Engineering case study",
} as const;

export const aboutPhilosophy = {
  statement: ABOUT_THESIS,
  supporting:
    "Frameworks and tools will change. Researching unfamiliar systems, testing assumptions, debugging failures, and building until the gaps close is the part that stays.",
} as const;

export const aboutCapabilities = {
  eyebrow: "Capabilities",
  title: "Three disciplines, kept in the same toolkit.",
  items: [
    {
      id: ROLES[0].id,
      title: ROLES[0].title,
      icon: ROLES[0].icon,
      description:
        "Frontend applications, backend APIs, cloud-connected systems, testing, and maintainable application architecture.",
    },
    {
      id: ROLES[1].id,
      title: ROLES[1].title,
      icon: ROLES[1].icon,
      description:
        "Visual systems, branding, interface composition, and layouts designed intentionally rather than from templates.",
    },
    {
      id: ROLES[2].id,
      title: ROLES[2].title,
      icon: ROLES[2].icon,
      description:
        "Hardware diagnostics, deployment, troubleshooting, system configuration, and methodical technical problem-solving.",
    },
  ],
} as const;

/**
 * Returns a case-study href only when that project exists.
 * Do not hard-code a path that 404s.
 */
export function getPromptEngineeringCaseStudyHref(): string | null {
  const project = getProjectById(PROMPT_ENGINEERING_PROJECT_ID);
  return project ? getProjectHref(project) : null;
}
