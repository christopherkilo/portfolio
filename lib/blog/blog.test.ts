import { describe, expect, it } from "vitest";
import { getGeneratedCoverKind } from "./covers";
import { extractHeadings } from "./headings";
import { BLOG_PRIMARY_FILTERS, partitionBlogFilters } from "./filters";
import { getAllPosts, getAllTags, getFeaturedPost, getLatestPosts, getPostBySlug } from "./posts";
import { getRelatedProject } from "./relatedProjects";
import { readingMinutesFromText } from "./readingTime";

describe("blog content source", () => {
  it("loads the StarLenz development update from markdown", () => {
    const post = getPostBySlug("building-starlenz");
    expect(post).not.toBeNull();
    expect(post?.title).toContain("Building StarLenz");
    expect(post?.featured).toBe(true);
    expect(post?.project).toBe("StarLenz");
    expect(post?.tags).toContain("Next.js");
    expect(post?.href).toBe("/blog/building-starlenz");
    expect(post?.readingMinutes).toBeGreaterThanOrEqual(6);
    expect(post?.content.includes("fit-to-frame")).toBe(true);
    expect(post?.content).not.toMatch(/placeholder:starlenz/);
    expect(post?.headings.length).toBeGreaterThan(8);
  });

  it("does not hardcode cards — index is derived from content files", () => {
    const posts = getAllPosts();
    const featured = getFeaturedPost();
    const latest = getLatestPosts(3);
    expect(posts.length).toBeGreaterThanOrEqual(5);
    expect(featured?.slug).toBe("building-starlenz");
    expect(latest.map((post) => post.slug)).toEqual([
      "ai-engineering",
      "rebuilding-taskflow-in-angular",
      "taking-novatech-to-aws",
    ]);
    expect(posts.every((post) => post.href.startsWith("/blog/"))).toBe(true);
    expect(posts.every((post) => getGeneratedCoverKind(post) !== null)).toBe(
      true,
    );
  });

  it("extracts heading ids used by the table of contents", () => {
    const headings = extractHeadings(
      "## 1. Starting With the Original Design\n\n### Nested\n",
    );
    expect(headings[0]).toMatchObject({
      level: 2,
      id: "1-starting-with-the-original-design",
    });
    expect(headings[1]?.id).toBe("nested");
  });

  it("links StarLenz to the in-development project placeholder", () => {
    const related = getRelatedProject("StarLenz");
    expect(related?.href).toBe("/projects/starlenz");
    expect(related?.inDevelopment).toBe(true);
  });

  it("links Event Horizon writing to the case study", () => {
    const related = getRelatedProject("Event Horizon");
    expect(related?.href).toBe("/projects/event-horizon");
    expect(related?.inDevelopment).toBeUndefined();
  });

  it("links NovaTech writing to the case study", () => {
    const related = getRelatedProject("NovaTech");
    expect(related?.href).toBe("/projects/novatech-solutions");
    expect(related?.inDevelopment).toBeUndefined();
  });

  it("links TaskFlow writing to the case study", () => {
    const related = getRelatedProject("TaskFlow");
    expect(related?.href).toBe("/projects/taskflow");
    expect(related?.inDevelopment).toBeUndefined();
  });

  it("loads the NovaTech AWS development update", () => {
    const post = getPostBySlug("taking-novatech-to-aws");
    expect(post).not.toBeNull();
    expect(post?.title).toBe("Taking NovaTech to AWS");
    expect(post?.project).toBe("NovaTech");
    expect(post?.featured).toBe(false);
    expect(post?.coverImage).toBe("generated:novatech");
    expect(getGeneratedCoverKind(post!)).toBe("novatech");
    expect(post?.content).toContain("Step Functions");
    expect(post?.content).toContain("DynamoDB");
    expect(post?.content).toContain("Turnstile");
    expect(post?.content).toContain("OIDC");
    expect(post?.content).toMatch(/at-least-once/);
    expect(post?.content).toMatch(/instance-local/);
    expect(post?.content).not.toMatch(/868150783834/);
    expect(post?.content).not.toMatch(/lambda-url/);
    expect(post?.headings.length).toBeGreaterThan(5);
  });

  it("loads the TaskFlow Angular development update", () => {
    const post = getPostBySlug("rebuilding-taskflow-in-angular");
    expect(post).not.toBeNull();
    expect(post?.title).toBe("Rebuilding TaskFlow in Angular");
    expect(post?.project).toBe("TaskFlow");
    expect(post?.featured).toBe(false);
    expect(post?.coverImage).toBe("generated:taskflow");
    expect(getGeneratedCoverKind(post!)).toBe("taskflow");
    expect(post?.content).toContain("Angular");
    expect(post?.content).toContain("learn the framework");
    expect(post?.content).toContain("/demos/taskflow");
    expect(post?.content).toMatch(/full application/);
    expect(post?.content).toContain("I am not going to call that production parity");
    expect(post?.headings.length).toBeGreaterThan(5);
  });

  it("loads the Event Horizon AWS development update", () => {
    const post = getPostBySlug("taking-event-horizon-to-aws");
    expect(post).not.toBeNull();
    expect(post?.title).toContain("Taking Event Horizon to AWS");
    expect(post?.project).toBe("Event Horizon");
    expect(post?.featured).toBe(false);
    expect(post?.coverImage).toBe("generated:event-horizon");
    expect(getGeneratedCoverKind(post!)).toBe("event-horizon");
    expect(post?.content).toContain("PostgreSQL");
    expect(post?.content).toContain("DynamoDB");
    expect(post?.content).not.toMatch(/868150783834/);
    expect(post?.content).not.toMatch(/lambda-url/);
    expect(post?.headings.length).toBeGreaterThan(5);
  });

  it("loads the AI Engineering case study", () => {
    const post = getPostBySlug("ai-engineering");
    expect(post).not.toBeNull();
    expect(post?.title).toBe(
      "AI Engineering: Designing Reliable Human–AI Development Workflows",
    );
    expect(post?.project).toBe("AI Engineering");
    expect(post?.featured).toBe(false);
    expect(post?.href).toBe("/blog/ai-engineering");
    expect(post?.coverImage).toBe("generated:ai-engineering");
    expect(getGeneratedCoverKind(post!)).toBe("ai-engineering");
    expect(post?.tags).toEqual([
      "AI Engineering",
      "Prompt Engineering",
      "Cursor",
      "QA",
    ]);
    expect(post?.content).toContain("ALREADY LOCKED — DO NOT REOPEN");
    expect(post?.content).toContain("CURRENT STATUS");
    expect(post?.content).toContain("task_update");
    expect(post?.content).toContain("ResolveOps");
    expect(post?.content).toContain("Trace before regenerating");
    expect(post?.content).toContain("Do not report PASS");
    expect(post?.content).toMatch(/\/projects\/taskflow/);
    expect(post?.content).toMatch(/\/projects\/event-horizon/);
    expect(post?.content).toMatch(/\/projects\/novatech-solutions/);
    expect(post?.content).toMatch(/\/about/);
    expect(post?.content).not.toMatch(/868150783834/);
    expect(post?.content).not.toMatch(/10x engineer/i);
    expect(post?.headings.length).toBeGreaterThan(12);
    expect(post?.readingMinutes).toBeGreaterThanOrEqual(10);
  });

  it("estimates reading time from copy, not frontmatter", () => {
    const minutes = readingMinutesFromText("word ".repeat(440));
    expect(minutes).toBe(2);
  });

  it("keeps blog index filters to browse categories, not a tag cloud", () => {
    const { primary, more } = partitionBlogFilters(getAllTags());
    expect(primary).toEqual([...BLOG_PRIMARY_FILTERS]);
    expect(primary).toContain("AI Engineering");
    expect(primary).not.toContain("DynamoDB");
    expect(primary).not.toContain("Next.js");
    expect(primary).not.toContain("Prompt Engineering");
    expect(more).toEqual(
      expect.arrayContaining([
        "Cursor",
        "DynamoDB",
        "ECS",
        "HubSpot",
        "Next.js",
        "Prompt Engineering",
        "QA",
        "Step Functions",
        "Supabase",
        "TypeScript",
        "UI/UX",
      ]),
    );
    expect(more).not.toContain("AI Engineering");
  });

  it("uses complete card excerpts instead of clipped summaries", () => {
    for (const post of getAllPosts()) {
      expect(post.description.endsWith("...")).toBe(false);
      expect(post.description).not.toMatch(/—without\.\.\.$/);
      expect(post.description.length).toBeLessThanOrEqual(160);
    }
    expect(getPostBySlug("taking-novatech-to-aws")?.description).toBe(
      "How a contact form grew from a synchronous HubSpot handler into a durable AWS inquiry workflow.",
    );
  });
});
