import { describe, expect, it } from "vitest";
import { extractHeadings } from "./headings";
import { getAllPosts, getFeaturedPost, getPostBySlug } from "./posts";
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
    expect(post?.headings.length).toBeGreaterThan(8);
  });

  it("does not hardcode cards — index is derived from content files", () => {
    const posts = getAllPosts();
    const featured = getFeaturedPost();
    expect(posts.length).toBeGreaterThanOrEqual(1);
    expect(featured?.slug).toBe("building-starlenz");
    expect(posts.every((post) => post.href.startsWith("/blog/"))).toBe(true);
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

  it("estimates reading time from copy, not frontmatter", () => {
    const minutes = readingMinutesFromText("word ".repeat(440));
    expect(minutes).toBe(2);
  });
});
