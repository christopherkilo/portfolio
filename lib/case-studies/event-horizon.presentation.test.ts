import { describe, expect, it } from "vitest";
import { getCaseStudy } from "@/lib/caseStudies";
import { getProjectById } from "@/lib/projectData";
import { resumeProjects } from "@/lib/resume";

describe("Event Horizon case-study presentation", () => {
  const study = getCaseStudy("event-horizon");

  it("describes dual persistence without replacing PostgreSQL", () => {
    expect(study).not.toBeNull();
    const blob = [
      study?.overview,
      study?.problem,
      study?.approach,
      study?.outcome,
      ...((study?.decisions ?? []).map((d) => `${d.title} ${d.explanation}`)),
    ].join(" ");
    expect(blob).toMatch(/PostgreSQL/i);
    expect(blob).toMatch(/DynamoDB/);
    expect(blob).toMatch(/Ticketmaster/);
    expect(blob.toLowerCase()).not.toContain("dynamodb replaces");
    expect(blob.toLowerCase()).not.toContain("dynamodb is inherently better");
  });

  it("keeps Ticketmaster listings as discovery, not reservations", () => {
    expect(study?.outcome).toMatch(/cannot enter the reservation/i);
    expect(study?.currentState?.demo?.some((item) => /discovery links/i.test(item))).toBe(
      true,
    );
  });

  it("uses verified engineering metrics rather than traffic or revenue", () => {
    const labels = study?.metrics.map((metric) => metric.label) ?? [];
    expect(labels).toEqual(
      expect.arrayContaining(["Refresh cadence", "Provider page", "Queue redrive"]),
    );
    const blob = JSON.stringify(study?.metrics);
    expect(blob).not.toMatch(/uptime/i);
    expect(blob).not.toMatch(/revenue/i);
    expect(blob).not.toMatch(/%/);
  });

  it("points GitHub to the portfolio repo that contains the current implementation", () => {
    const project = getProjectById("event-horizon");
    expect(project?.github).toBe(
      "https://github.com/christopherkilo/portfolio/tree/main/app/demos/event-horizon",
    );
    expect(project?.github).toContain("christopherkilo/portfolio");
    expect(project?.github).not.toContain("christopherkilo/event-horizon");
    expect(project?.githubNote).toBe("Source: portfolio monorepo");
  });

  it("renders grouped technologies instead of a card-sized AWS badge wall", () => {
    const project = getProjectById("event-horizon");
    expect(project?.technologies).toEqual(["Next.js", "TypeScript", "PostgreSQL", "AWS"]);
    expect(study?.architectureEntry).toEqual(["User", "Event Horizon / Next.js"]);
    expect(study?.decisionsHeading).toBe("Engineering decisions");
    expect(study?.techGroups?.find((group) => group.label === "AWS cloud")?.items).toEqual(
      expect.arrayContaining(["CloudWatch", "CDK", "SQS", "DynamoDB"]),
    );
  });

  it("keeps the resume bullet architectural and outcome-focused", () => {
    const project = resumeProjects.find((item) => item.id === "event-horizon");
    expect(project?.summary).toMatch(/Fargate/);
    expect(project?.summary).toMatch(/PostgreSQL/);
    expect(project?.summary).toMatch(/Ticketmaster/);
    expect(project?.summary.toLowerCase()).not.toContain("production traffic");
  });
});
