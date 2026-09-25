import { describe, expect, it } from "vitest";
import {
  ABOUT_THESIS,
  aboutAI,
  aboutCapabilities,
  aboutHero,
  aboutLearningClusters,
  aboutPath,
  aboutPhilosophy,
  getAboutCertifications,
  getAboutEducation,
  getPromptEngineeringCaseStudyHref,
  AI_ENGINEERING_ARTICLE_SLUG,
  PROMPT_ENGINEERING_PROJECT_ID,
} from "./about";
import { ROLES } from "./constants";
import { getProjectById } from "./projectData";
import { resumeCertifications, resumeEducation } from "./resume";

describe("about page content", () => {
  it("introduces Christopher without dumping the education story into the hero", () => {
    expect(aboutHero.title).toContain("Christopher Kilo");
    expect(aboutHero.lead.toLowerCase()).toContain("software engineer");
    expect(aboutHero.supporting.join(" ").toLowerCase()).toContain("building");
    expect(aboutHero.supporting).toHaveLength(3);
    expect(aboutHero.supporting.join(" ")).not.toMatch(
      /passionate developer|technology enthusiast|lifelong learner|results-driven|coding enthusiast/i,
    );
    expect(aboutHero.lead).not.toMatch(/job corps/i);
    expect(aboutHero.lead).not.toMatch(/davis technical/i);
  });

  it("frames the path as nontraditional without apology or anti-college language", () => {
    const blob = [
      aboutPath.opening,
      aboutPath.foundation,
      aboutPath.emphasis,
      aboutPath.progression,
      aboutPath.independent,
      aboutPath.method,
    ].join(" ");

    expect(blob).toMatch(/hasn't followed a traditional four-year computer science degree/i);
    expect(blob).toMatch(/Job Corps/);
    expect(blob).toMatch(/Davis Technical College/);
    expect(blob).not.toMatch(/I don't have an education/i);
    expect(blob).not.toMatch(/uneducated/i);
    expect(blob).not.toMatch(/degrees are unnecessary/i);
    expect(blob).not.toMatch(/coding ninja|rockstar|passionate developer|lifelong learner/i);
  });

  it("reuses resume education records instead of inventing programs or dates", () => {
    const education = getAboutEducation();
    expect(education.map((item) => item.school)).toEqual(
      resumeEducation.map((item) => item.school),
    );
    expect(education.some((item) => /Job Corps/i.test(item.school))).toBe(true);
    expect(education.some((item) => item.school === "Davis Technical College")).toBe(
      true,
    );

    for (const item of education) {
      const source = resumeEducation.find((entry) => entry.school === item.school);
      expect(source).toBeDefined();
      expect(item.credential).toBe(source!.credential);
      expect(item.dates).toBe(source!.dates);
      expect(item.location).toBe(source!.location);
    }
  });

  it("reuses resume certification titles and does not invent a Google AI credential", () => {
    const certifications = getAboutCertifications();
    expect(certifications.map((item) => item.name)).toEqual(
      resumeCertifications.map((item) => item.name),
    );
    expect(certifications.some((item) => item.name === "CompTIA A+" && item.highlight)).toBe(
      true,
    );
    expect(
      certifications.some((item) => item.name === "Web and Graphic Design"),
    ).toBe(true);

    const googleInResume = resumeCertifications.some((item) =>
      /google/i.test(item.name),
    );
    expect(googleInResume).toBe(false);
    expect(certifications.some((item) => /google/i.test(item.name))).toBe(false);
  });

  it("keeps independent-learning clusters aligned with portfolio evidence", () => {
    const labels = aboutLearningClusters.map((cluster) => cluster.label);
    expect(labels).toEqual([
      "Applications",
      "Systems",
      "Cloud & Delivery",
      "Quality",
    ]);
    const items = aboutLearningClusters.flatMap((cluster) => [...cluster.items]);
    expect(items).toEqual(
      expect.arrayContaining([
        "React",
        "Next.js",
        "Angular",
        "TypeScript",
        "PostgreSQL",
        "Supabase",
        "Prisma",
        "AWS",
        "Playwright",
        "Accessibility",
      ]),
    );
  });

  it("treats AI as a learning tool rather than a substitute for understanding", () => {
    const blob = aboutAI.paragraphs.join(" ");
    expect(blob).toMatch(/not as a replacement for understanding/i);
    expect(blob).not.toMatch(/AI taught me everything/i);
    expect(blob).not.toMatch(/outsourcing understanding/i);
  });

  it("links the AI Engineering case study from the About page", () => {
    expect(getProjectById(PROMPT_ENGINEERING_PROJECT_ID)).toBeUndefined();
    expect(getPromptEngineeringCaseStudyHref()).toBe(
      `/blog/${AI_ENGINEERING_ARTICLE_SLUG}`,
    );
    expect(aboutAI.caseStudyLabel).toBe("Read the AI Engineering case study");
  });

  it("keeps the learning thesis as a distinct statement", () => {
    expect(aboutPhilosophy.statement).toBe(ABOUT_THESIS);
    expect(ABOUT_THESIS).toBe(
      "When I encounter something I don't know, I know how to learn it.",
    );
  });

  it("keeps the three existing capability areas as a compact summary", () => {
    expect(aboutCapabilities.items.map((item) => item.title)).toEqual(
      ROLES.map((role) => role.title),
    );
    expect(aboutCapabilities.items).toHaveLength(3);
  });
});
