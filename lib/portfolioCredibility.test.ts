import { describe, expect, it } from "vitest";
import { getCaseStudy } from "./caseStudies";
import { getEngineeringLabItems } from "./engineeringLab";
import {
  FEATURED_PROOF_LIMIT,
  getFeaturedApplicationProjects,
  getFeaturedCardProofPoints,
  getHomepageFeaturedProjects,
  getPortfolioProjects,
  getPublicSurfaceLinkLabel,
  PROJECT_STATUS_LABELS,
} from "./projectData";
import { getTestimonials } from "./testimonials";
import { getWorkIndexGroups } from "./workIndex";

const FORBIDDEN_PROOF = [
  /uptime/i,
  /revenue/i,
  /99\.99/,
  /43 automated/,
  /testimonial/i,
  /production traffic/i,
  /exactly-once/i,
];

describe("portfolio proof metadata", () => {
  it("keeps the homepage carousel order unchanged", () => {
    expect(getHomepageFeaturedProjects().map((project) => project.id)).toEqual([
      "event-horizon",
      "novatech-solutions",
      "taskflow",
      "kilo-toolkit",
    ]);
    expect(getHomepageFeaturedProjects().map((project) => project.id)).not.toContain(
      "starlenz",
    );
  });

  it("keeps StarLenz off Featured Applications while leaving it in All Work", () => {
    expect(getFeaturedApplicationProjects().map((project) => project.id)).toEqual([
      "event-horizon",
      "novatech-solutions",
      "taskflow",
    ]);
    expect(getPortfolioProjects().map((project) => project.id)).toContain("starlenz");
  });

  it("adds 2–4 proof points to every portfolio-visible card without invented metrics", () => {
    for (const project of getPortfolioProjects()) {
      expect(project.proofPoints?.length).toBeGreaterThanOrEqual(2);
      expect(project.proofPoints?.length).toBeLessThanOrEqual(4);
      const blob = (project.proofPoints ?? []).join(" ");
      for (const pattern of FORBIDDEN_PROOF) {
        expect(blob).not.toMatch(pattern);
      }
    }
  });

  it("limits featured-card proof to two differentiating facts", () => {
    for (const project of getHomepageFeaturedProjects()) {
      const featured = getFeaturedCardProofPoints(project);
      expect(featured).toHaveLength(FEATURED_PROOF_LIMIT);
      const blob = featured.join(" ").toLowerCase();
      for (const pattern of FORBIDDEN_PROOF) {
        expect(blob).not.toMatch(pattern);
      }
    }

    expect(getFeaturedCardProofPoints(getHomepageFeaturedProjects()[0]!)).toEqual([
      "AWS CDK ingestion · SQS + DLQ",
      "Idempotent DynamoDB writes",
    ]);
    expect(getFeaturedCardProofPoints(getHomepageFeaturedProjects()[1]!)).toEqual([
      "OIDC-authenticated AWS workflow",
      "Step Functions + CRM verified",
    ]);
    const taskflow = getHomepageFeaturedProjects()[2]!;
    expect(getFeaturedCardProofPoints(taskflow)).toEqual([
      "React + Angular clients",
      "Offline queue + optimistic concurrency",
    ]);
    expect(getFeaturedCardProofPoints(taskflow).join(" ")).not.toMatch(
      /realtime/i,
    );
    expect(taskflow.proofPoints).toContain("Realtime collaboration");
    expect(
      getHomepageFeaturedProjects()[0]?.proofPoints,
    ).toContain("Playwright QA");
  });

  it("does not invent a public Angular live demo", () => {
    const angular = getEngineeringLabItems().find((item) => item.id === "taskflow-angular");
    expect(angular?.state).toBe("experiment");
    expect(angular?.liveHref).toBeUndefined();
    expect(angular?.description.toLowerCase()).toMatch(/not production-deployed/);
  });

  it("uses precise status labels instead of a bare Live badge", () => {
    const lab = getEngineeringLabItems();
    expect(lab.map((item) => item.state)).not.toContain("live");
    expect(lab.map((item) => item.state)).not.toContain("live-app");
    expect(lab.find((item) => item.id === "event-horizon")?.state).toBe("live-demo");
    expect(lab.find((item) => item.id === "taskflow")?.state).toBe("live-demo");
    expect(lab.find((item) => item.id === "novatech-solutions")?.state).toBe(
      "production-verified",
    );
    expect(lab.find((item) => item.id === "starlenz")?.state).toBe("active-development");
    expect(lab.find((item) => item.id === "kilo-toolkit")?.state).toBe("demo");
    expect(lab.find((item) => item.id === "taskflow")?.liveHref).toBe("/demos/taskflow");

    const groups = getWorkIndexGroups();
    const web = Object.fromEntries(
      (groups[0]?.items ?? []).map((item) => [item.id, item.status]),
    );
    expect(web["event-horizon"]).toBe("Live demo");
    expect(web.taskflow).toBe("Live demo");
    expect(web["novatech-solutions"]).toBe("Production verified");
    expect(web["taskflow-angular"]).toBe("Experiment");
    expect(web.starlenz).toBe("Active development");
    expect(groups[1]?.items[0]?.status).toBe("Demo");

    expect(Object.values(PROJECT_STATUS_LABELS)).not.toContain("Live");
    expect(getPublicSurfaceLinkLabel("event-horizon")).toBe("Live Demo");
    expect(getPublicSurfaceLinkLabel("taskflow")).toBe("Live Demo");
    expect(getPublicSurfaceLinkLabel("novatech-solutions")).toBe("Open demo");
    expect(getPublicSurfaceLinkLabel("kilo-toolkit")).toBe("Open demo");
  });

  it("groups All Work by existing categories and lists Angular after TaskFlow", () => {
    const groups = getWorkIndexGroups();
    expect(groups.map((group) => group.category)).toEqual(["web", "it", "design"]);
    const webIds = groups[0]?.items.map((item) => item.id) ?? [];
    expect(webIds).toContain("event-horizon");
    expect(webIds).toContain("starlenz");
    expect(webIds.indexOf("taskflow-angular")).toBe(webIds.indexOf("taskflow") + 1);
    expect(groups[1]?.items.some((item) => item.id === "kilo-toolkit")).toBe(true);
    expect(webIds).not.toContain("resolveops");
  });

  it("does not render testimonials while none are verified", () => {
    expect(getTestimonials()).toEqual([]);
  });
});

describe("case-study snapshots and verification", () => {
  it("gives Event Horizon, NovaTech, and TaskFlow recruiter snapshots", () => {
    for (const id of ["event-horizon", "novatech-solutions", "taskflow"] as const) {
      const study = getCaseStudy(id);
      expect(study?.snapshot?.role).toBeTruthy();
      expect(study?.snapshot?.architecture).toBeTruthy();
      expect(study?.verification?.items.length).toBeGreaterThan(0);
    }
  });

  it("keeps Event Horizon honest about discovery vs ingestion success", () => {
    const study = getCaseStudy("event-horizon");
    const blob = JSON.stringify(study?.verification);
    expect(blob.toLowerCase()).toContain("discovery-only");
    expect(blob.toLowerCase()).toContain("never enter event horizon checkout");
    expect(blob).not.toMatch(/43 automated/);
    expect(blob).not.toMatch(/868150783834/);
  });

  it("keeps NovaTech verification free of secrets and a duplicate receipts list", () => {
    const study = getCaseStudy("novatech-solutions");
    const blob = JSON.stringify(study?.verification);
    expect(study?.verification?.receipts).toBeUndefined();
    expect(study?.verification?.items.map((item) => item.category)).toEqual([
      "deployed",
      "tested",
      "secure",
      "observable",
      "integrated",
    ]);
    expect(blob).toMatch(/CloudTrail/);
    expect(blob).toMatch(/HubSpot/);
    expect(blob).toMatch(/OIDC/);
    expect(blob).not.toMatch(/AKIA/);
    expect(blob).not.toMatch(/ASIA/);
    expect(blob).not.toMatch(/868150783834/);
    expect(blob).not.toMatch(/lambda-url/);
    expect(blob.toLowerCase()).not.toContain("exactly-once");
  });

  it("frames Angular TaskFlow as a learning rebuild, not the public demo", () => {
    const study = getCaseStudy("taskflow");
    expect(study?.overview).toMatch(/learn the framework/);
    expect(study?.snapshot?.status).toBe("Live demo");
    expect(JSON.stringify(study?.verification).toLowerCase()).toContain(
      "not production-deployed",
    );
  });

  it("keeps snapshot status labels from implying a public production product", () => {
    expect(getCaseStudy("event-horizon")?.snapshot?.status).toBe("Live demo");
    expect(getCaseStudy("novatech-solutions")?.snapshot?.status).toMatch(
      /Production-verified inquiry path/i,
    );
    expect(getCaseStudy("novatech-solutions")?.snapshot?.status).not.toMatch(
      /live portfolio demo/i,
    );
    expect(getCaseStudy("taskflow")?.snapshot?.status).toBe("Live demo");
  });
});

describe("case-study editorial structure", () => {
  it("does not maintain duplicate decision or next-steps systems", () => {
    for (const id of ["event-horizon", "novatech-solutions", "taskflow"] as const) {
      const study = getCaseStudy(id);
      expect(study).not.toHaveProperty("deepDives");
      expect(study).not.toHaveProperty("highlights");
      expect(study?.currentState).not.toHaveProperty("planned");
      expect(study).not.toHaveProperty("nextStepsIntro");
      expect(study?.decisions?.length).toBeGreaterThan(0);
      expect(study?.decisions?.length).toBeLessThanOrEqual(5);
      expect(study?.metrics.length).toBeLessThanOrEqual(3);
      expect(study?.verification?.items.length).toBeGreaterThanOrEqual(3);
      expect(study?.verification?.items.length).toBeLessThanOrEqual(5);
      expect(
        (study?.verification?.receipts ?? []).every((receipt) => Boolean(receipt.href)),
      ).toBe(true);
      expect((study?.verification?.limitations ?? []).length).toBeLessThanOrEqual(3);
      expect((study?.nextSteps ?? []).length).toBeLessThanOrEqual(4);
      expect((study?.currentState?.implemented ?? []).length).toBeLessThanOrEqual(7);
    }
  });
});
