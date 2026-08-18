import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { extractHeadings } from "./headings";
import { formatReadingTime, readingMinutesFromText } from "./readingTime";
import type { BlogFrontmatter, BlogPost, BlogPostMeta } from "./types";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toIsoDate(value: unknown): string | null {
  if (isIsoDate(value)) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFrontmatter(
  data: Record<string, unknown>,
  fallbackSlug: string,
): BlogFrontmatter {
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  if (!title) throw new Error(`Blog post "${fallbackSlug}" is missing a title.`);
  if (!description) {
    throw new Error(`Blog post "${fallbackSlug}" is missing a description.`);
  }
  const date = toIsoDate(data.date);
  if (!date) {
    throw new Error(
      `Blog post "${fallbackSlug}" needs a date in YYYY-MM-DD format.`,
    );
  }

  const updated = toIsoDate(data.updated);
  if (data.updated != null && !updated) {
    throw new Error(
      `Blog post "${fallbackSlug}" has an invalid updated date (use YYYY-MM-DD).`,
    );
  }

  return {
    title,
    description,
    date,
    updated: updated ?? undefined,
    tags: asStringArray(data.tags),
    project: typeof data.project === "string" ? data.project.trim() : undefined,
    coverImage:
      typeof data.coverImage === "string" ? data.coverImage.trim() : undefined,
    featured: data.featured === true,
    slug: typeof data.slug === "string" ? data.slug.trim() : fallbackSlug,
    status: data.status === "draft" ? "draft" : "published",
  };
}

function toMeta(frontmatter: BlogFrontmatter, content: string): BlogPostMeta {
  const slug = frontmatter.slug ?? "";
  const minutes = readingMinutesFromText(content);
  return {
    slug,
    href: `/blog/${slug}`,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    updated: frontmatter.updated,
    tags: frontmatter.tags,
    project: frontmatter.project,
    coverImage: frontmatter.coverImage,
    featured: Boolean(frontmatter.featured),
    readingMinutes: minutes,
    readingTime: formatReadingTime(minutes),
  };
}

function readPostFile(filename: string): BlogPost | null {
  const slugFromFile = filename.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8");
  const parsed = matter(raw);
  const frontmatter = parseFrontmatter(
    parsed.data as Record<string, unknown>,
    slugFromFile,
  );
  if (frontmatter.status === "draft") return null;

  const content = parsed.content.trim();
  return {
    ...toMeta({ ...frontmatter, slug: frontmatter.slug || slugFromFile }, content),
    content,
    headings: extractHeadings(content),
  };
}

function listMarkdownFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .sort();
}

export function getAllPosts(): BlogPostMeta[] {
  return listMarkdownFiles()
    .map((file) => readPostFile(file))
    .filter((post): post is BlogPost => Boolean(post))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
    .map((post) => {
      return {
        slug: post.slug,
        href: post.href,
        title: post.title,
        description: post.description,
        date: post.date,
        updated: post.updated,
        tags: post.tags,
        project: post.project,
        coverImage: post.coverImage,
        featured: post.featured,
        readingTime: post.readingTime,
        readingMinutes: post.readingMinutes,
      };
    });
}

export function getPostBySlug(slug: string): BlogPost | null {
  const files = listMarkdownFiles();
  const match = files.find((file) => file.replace(/\.mdx?$/, "") === slug);
  if (!match) {
    for (const file of files) {
      const post = readPostFile(file);
      if (post?.slug === slug) return post;
    }
    return null;
  }
  return readPostFile(match);
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

export function getFeaturedPost(): BlogPostMeta | null {
  const posts = getAllPosts();
  return posts.find((post) => post.featured) ?? posts[0] ?? null;
}

export function getLatestPosts(limit = 3): BlogPostMeta[] {
  return getAllPosts().slice(0, limit);
}

export function getAdjacentPosts(slug: string): {
  previous: BlogPostMeta | null;
  next: BlogPostMeta | null;
} {
  const posts = getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index < 0) return { previous: null, next: null };
  return {
    next: posts[index - 1] ?? null,
    previous: posts[index + 1] ?? null,
  };
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
