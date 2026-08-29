import { describe, expect, it } from "vitest";
import { getCaseStudy } from "@/lib/caseStudies";
import { getProjectById } from "@/lib/projectData";
import { resumeProjects } from "@/lib/resume";

describe("NovaTech case-study presentation", () => {
  const study = getCaseStudy("novatech-solutions");

  it("describes the AWS inquiry path without overclaiming", () => {
    expect(study).not.toBeNull();
    const blob = [
      study?.overview,
      study?.problem,
      study?.approach,
      study?.howItWorks,
      study?.outcome,
      ...((study?.decisions ?? []).map((d) => `${d.title} ${d.explanation}`)),
    ].join(" ");
    expect(blob).toMatch(/Step Functions/);
    expect(blob).toMatch(/Turnstile/);
    expect(blob).toMatch(/OIDC/);
    expect(blob).toMatch(/HubSpot/);
    expect(blob).toMatch(/DynamoDB/);
    expect(blob.toLowerCase()).not.toContain("exactly-once");
    expect(blob.toLowerCase()).not.toContain("exactly once");
    expect(blob.toLowerCase()).not.toContain("enterprise-grade");
    expect(blob.toLowerCase()).not.toContain("zero downtime");
    expect(blob.toLowerCase()).not.toContain("infinite scale");
  });

  it("keeps the browser off AWS and does not wait for email", () => {
    expect(study?.howItWorks).toMatch(/202/);
    expect(study?.outcome).toMatch(/202/);
    const blob = `${study?.overview} ${study?.architectureHighlight?.description}`;
    expect(blob).toMatch(/never talks to AWS/i);
  });

  it("renders the final architecture diagram", () => {
    expect(study?.architecture).toEqual([
      "Visitor",
      "NovaTech form",
      "Next.js Route Handler",
      "Turnstile",
      "Step Functions",
      "DynamoDB",
      "HubSpot",
      "SQS",
      "Resend",
    ]);
    expect(study?.architectureEntry).toEqual(["Visitor", "NovaTech / Next.js"]);
    expect(study?.architectureLanes?.map((lane) => lane.title)).toEqual([
      "Public ingress",
      "Durable workflow",
    ]);
  });

  it("uses verified engineering metrics rather than traffic or revenue", () => {
    const labels = study?.metrics.map((metric) => metric.label) ?? [];
    expect(labels).toEqual(
      expect.arrayContaining(["HTTP success", "Ingress IAM", "Notification jobs"]),
    );
    const blob = JSON.stringify(study?.metrics);
    expect(blob).not.toMatch(/uptime/i);
    expect(blob).not.toMatch(/revenue/i);
    expect(blob).not.toMatch(/%/);
  });

  it("keeps the resume bullet architectural and outcome-focused", () => {
    const project = resumeProjects.find((item) => item.id === "novatech-solutions");
    expect(project?.summary).toMatch(/Step Functions/);
    expect(project?.summary).toMatch(/DynamoDB/);
    expect(project?.summary).toMatch(/HubSpot/);
    expect(project?.summary).toMatch(/Resend/);
    expect(project?.summary.toLowerCase()).not.toContain("exactly-once");
    expect(project?.summary.toLowerCase()).not.toContain("production traffic");
  });

  it("does not keep an in-memory duplicate guard as the production story", () => {
    const implemented = study?.currentState?.implemented?.join(" ") ?? "";
    expect(implemented.toLowerCase()).not.toContain("in-memory");
    expect(implemented).toMatch(/DynamoDB/);
  });

  it("keeps the project card technologies compact", () => {
    const project = getProjectById("novatech-solutions");
    expect(project?.technologies).toEqual(["Next.js", "TypeScript", "HubSpot", "AWS"]);
  });
});
