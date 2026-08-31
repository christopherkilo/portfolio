import { describe, expect, it } from "vitest";
import { getAllCaseStudyIds, getCaseStudy } from "./caseStudies";
import {
  getHomepageFeaturedProjects,
  getPortfolioProjects,
  getProjectById,
  getProjectHref,
  getProjectsByCategory,
  hasLiveDemo,
  homepageFeaturedProjectIds,
  isExternalHref,
  isInternalHref,
  isPublicLiveDemoUrl,
  projects,
} from "./projectData";

const WEB_IDS = [
  "event-horizon",
  "novatech-solutions",
  "taskflow",
] as const;

const DEMO_BY_ID = {
  "event-horizon": "/demos/event-horizon",
  "novatech-solutions": "/demos/novatech-solutions",
  taskflow: "/demos/taskflow",
} as const;

describe("web project routing metadata", () => {
  it("gives every web project an explicit internal case-study href", () => {
    for (const id of WEB_IDS) {
      const project = getProjectById(id);
      expect(project).toBeDefined();
      expect(project?.href).toBe(`/projects/${id}`);
      expect(getProjectHref(project!)).toBe(`/projects/${id}`);
      expect(isInternalHref(project?.href)).toBe(true);
    }
  });

  it("gives every web project an internal live-demo href", () => {
    for (const id of WEB_IDS) {
      const project = getProjectById(id);
      expect(project?.liveDemo).toBe(DEMO_BY_ID[id]);
      expect(isInternalHref(project?.liveDemo)).toBe(true);
      expect(hasLiveDemo(project?.liveDemo)).toBe(true);
      expect(isExternalHref(project?.liveDemo)).toBe(false);
    }
  });

  it("has matching case-study data for every web project", () => {
    for (const id of WEB_IDS) {
      const study = getCaseStudy(id);
      expect(study).not.toBeNull();
      expect(study?.project.id).toBe(id);
      expect(study?.overview.length).toBeGreaterThan(40);
      expect(study?.project.liveDemo).toBe(DEMO_BY_ID[id]);
    }
  });

  it("includes all web IDs in generateStaticParams source list", () => {
    const ids = getAllCaseStudyIds();
    for (const id of WEB_IDS) {
      expect(ids).toContain(id);
    }
  });

  it("exposes only the three active web case studies", () => {
    expect(getAllCaseStudyIds().sort()).toEqual([...WEB_IDS].sort());
    expect(getCaseStudy("signal-board")).toBeNull();
    expect(getCaseStudy("edge-lab-network")).toBeNull();
    expect(getCaseStudy("fleet-image-pipeline")).toBeNull();
    expect(getCaseStudy("bench-diagnostics")).toBeNull();
  });

  it("does not expose localhost liveDemo values on web projects", () => {
    for (const id of WEB_IDS) {
      const project = getProjectById(id);
      expect(String(project?.liveDemo ?? "")).not.toMatch(
        /localhost|127\.0\.0\.1|:3001|:3002|:3003/,
      );
    }
  });

  it("rejects invalid public live demo URLs while allowing internal demos", () => {
    expect(isPublicLiveDemoUrl(undefined)).toBe(false);
    expect(isPublicLiveDemoUrl("http://localhost:3002")).toBe(false);
    expect(isPublicLiveDemoUrl("http://127.0.0.1:3001")).toBe(false);
    expect(isPublicLiveDemoUrl("/projects/event-horizon")).toBe(false);
    expect(isPublicLiveDemoUrl("/demos/event-horizon")).toBe(false);
    expect(isPublicLiveDemoUrl("https://example.com/demo")).toBe(true);
    expect(hasLiveDemo("/demos/taskflow")).toBe(true);
    expect(hasLiveDemo("https://example.com/demo")).toBe(true);
  });

  it("lists the three flagship web case studies plus StarLenz", () => {
    expect(getProjectsByCategory("web").map((p) => p.id)).toEqual([
      ...WEB_IDS,
      "starlenz",
    ]);
  });

  it("features all four software apps on the homepage carousel", () => {
    expect(getHomepageFeaturedProjects().map((p) => p.id)).toEqual([
      ...WEB_IDS,
      "kilo-toolkit",
    ]);
    expect(homepageFeaturedProjectIds).toEqual([
      "event-horizon",
      "novatech-solutions",
      "taskflow",
      "kilo-toolkit",
    ]);
    expect(getPortfolioProjects().map((p) => p.id)).toEqual([
      ...WEB_IDS,
      "starlenz",
      "kilo-toolkit",
      "voltline",
      "nightshift",
      "signal-magazine",
    ]);
    expect(getProjectById("starlenz")?.inDevelopment).toBe(true);
    expect(getProjectHref(getProjectById("starlenz")!)).toBe("/projects/starlenz");
  });

  it("routes Kilo Toolkit to the live suite, not a web case-study page", () => {
    const toolkit = getProjectById("kilo-toolkit")!;
    expect(toolkit.category).toBe("it");
    expect(getProjectHref(toolkit)).toBe("/toolkit");
    expect(toolkit.liveDemo).toBe("/toolkit");
  });

  it("keeps toolkit module deep-links without listing them on portfolio grids", () => {
    for (const id of ["systemscope", "memorymedic", "netcheck"] as const) {
      const project = getProjectById(id);
      expect(project).toBeDefined();
      expect(project?.portfolioVisible).toBe(false);
      expect(project?.href).toMatch(/^\/toolkit\//);
    }
  });

  it("exposes the professional contact email from site constants", async () => {
    const { SITE } = await import("./constants");
    expect(SITE.email).toBe("christopherkilo.pro@gmail.com");
    expect(SITE.email).not.toContain("hello@");
  });

  it("points resume links at the approved public PDF filename", async () => {
    const { SITE } = await import("./constants");
    expect(SITE.resume).toBe("/Christopher_Kilo_Resume.pdf");
    expect(SITE.resumeFileName).toBe("Christopher_Kilo_Resume.pdf");
    expect(SITE.github).toBe("https://github.com/christopherkilo");
    expect(SITE.url).toBe("https://www.christopherkilo.com");
    expect(SITE.linkedin).toBe(
      "https://www.linkedin.com/in/christopher-kilo-312467425/",
    );
  });

  it("includes Resume in primary navigation between About and Contact", async () => {
    const { NAV_LINKS } = await import("./constants");
    expect(NAV_LINKS.map((link) => link.id)).toEqual([
      "home",
      "projects",
      "blog",
      "about",
      "resume",
      "contact",
    ]);
    expect(NAV_LINKS.find((link) => link.id === "resume")?.href).toBe("/resume");
    expect(NAV_LINKS.find((link) => link.id === "blog")?.href).toBe("/blog");
  });

  it("keeps resume page data aligned with the three flagship case studies", async () => {
    const { resumeProjects, resumeCertifications } = await import("./resume");
    expect(resumeProjects.map((p) => p.id)).toEqual([
      "event-horizon",
      "novatech-solutions",
      "taskflow",
    ]);
    expect(resumeProjects.every((p) => p.href.startsWith("/projects/"))).toBe(
      true,
    );
    expect(
      resumeCertifications.some((c) => c.name === "CompTIA A+" && c.highlight),
    ).toBe(true);
  });

  it("keeps cards pointed at case studies rather than demos", () => {
    for (const id of WEB_IDS) {
      const project = getProjectById(id)!;
      expect(getProjectHref(project)).toBe(`/projects/${id}`);
      expect(getProjectHref(project)).not.toBe(project.liveDemo);
    }
  });

  it("keeps GitHub links external", () => {
    for (const id of WEB_IDS) {
      const project = getProjectById(id)!;
      expect(project.github).toMatch(/^https:\/\/github\.com\//);
      expect(isExternalHref(project.github)).toBe(true);
    }
    expect(getProjectById("event-horizon")?.github).toBe(
      "https://github.com/christopherkilo/portfolio/tree/main/app/demos/event-horizon",
    );
    expect(getProjectById("event-horizon")?.githubNote).toBe(
      "Source: portfolio monorepo",
    );
    expect(getProjectById("novatech-solutions")?.github).toBe(
      "https://github.com/christopherkilo/novatech-solutions",
    );
    expect(getProjectById("taskflow")?.github).toBe(
      "https://github.com/christopherkilo/taskflow",
    );
    expect(getProjectById("kilo-toolkit")?.github).toBe(
      "https://github.com/christopherkilo/portfolio/tree/main/app/toolkit",
    );
    expect(getProjectById("kilo-toolkit")?.githubNote).toBe(
      "Source: portfolio monorepo",
    );
  });

  it("labels shared GitHub links as the portfolio monorepo", async () => {
    const {
      githubControlLabel,
      isPortfolioMonorepoGithub,
      PORTFOLIO_GITHUB_REPO,
    } = await import("./projectData");
    expect(isPortfolioMonorepoGithub(PORTFOLIO_GITHUB_REPO)).toBe(true);
    expect(
      isPortfolioMonorepoGithub(`${PORTFOLIO_GITHUB_REPO}/tree/main/app/toolkit`),
    ).toBe(true);
    expect(
      isPortfolioMonorepoGithub("https://github.com/christopherkilo/taskflow"),
    ).toBe(false);
    const eventHorizon = getProjectById("event-horizon")!;
    expect(githubControlLabel(eventHorizon)).toContain("portfolio monorepo");
    const taskflow = getProjectById("taskflow")!;
    expect(githubControlLabel(taskflow)).toBe("TaskFlow on GitHub");
  });

  it("never stores localhost liveDemo anywhere in project metadata", () => {
    for (const project of projects) {
      if (!project.liveDemo) continue;
      expect(project.liveDemo).not.toMatch(/localhost|127\.0\.0\.1/i);
      expect(project.liveDemo).not.toMatch(/:300[123](?:\/|$)/);
    }
  });
});

describe("demo route correspondence", () => {
  it("maps each demo route back to its case study", () => {
    for (const id of WEB_IDS) {
      const project = getProjectById(id)!;
      expect(project.liveDemo).toBe(`/demos/${id}`);
      expect(project.href).toBe(`/projects/${id}`);
    }
  });
});
