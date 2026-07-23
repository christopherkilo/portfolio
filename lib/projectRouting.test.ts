import { describe, expect, it } from "vitest";
import { getAllCaseStudyIds, getCaseStudy } from "./caseStudies";
import {
  getProjectById,
  getProjectHref,
  getProjectsByCategory,
  hasLiveDemo,
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

  it("still lists three web projects for category filters", () => {
    expect(getProjectsByCategory("web").map((p) => p.id)).toEqual([
      ...WEB_IDS,
    ]);
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
