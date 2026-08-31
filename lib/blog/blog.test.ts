import { describe, expect, it } from "vitest";
import { getGeneratedCoverKind } from "./covers";
import { extractHeadings } from "./headings";
import { getAllPosts, getFeaturedPost, getLatestPosts, getPostBySlug } from "./posts";
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
    expect(posts.length).toBeGreaterThanOrEqual(3);
    expect(featured?.slug).toBe("building-starlenz");
    expect(latest.map((post) => post.slug)).toEqual([
      "taking-novatech-to-aws",
      "taking-event-horizon-to-aws",
      "building-starlenz",
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

  it("loads the Event Horizon AWS development update", () => {
    const post = getPostBySlug("taking-event-horizon-to-aws");
    expect(post).not.toBeNull();
    expect(post?.title).toContain("Taking Event Horizon to AWS");
    expect(post?.project).toBe("Event Horizon");
    expect(post?.featured).toBe(false);
    expect(post?.content).toContain("PostgreSQL");
    expect(post?.content).toContain("DynamoDB");
    expect(post?.content).not.toMatch(/868150783834/);
    expect(post?.content).not.toMatch(/lambda-url/);
    expect(post?.headings.length).toBeGreaterThan(5);
  });

  it("estimates reading time from copy, not frontmatter", () => {
    const minutes = readingMinutesFromText("word ".repeat(440));
    expect(minutes).toBe(2);
  });
});
