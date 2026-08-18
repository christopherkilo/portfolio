export type BlogPostStatus = "published" | "draft";

export type BlogFrontmatter = {
  title: string;
  description: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** ISO date string when the article was last revised. */
  updated?: string;
  tags: string[];
  /** Associated portfolio project title (e.g. "StarLenz"). */
  project?: string;
  /**
   * Cover image path under /public, or `placeholder:<file>` until an asset exists.
   * Omit to use a generated editorial cover when one is registered for the project.
   */
  coverImage?: string;
  featured?: boolean;
  /** Defaults to the filename. */
  slug?: string;
  status?: BlogPostStatus;
};

export type BlogHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type BlogPostMeta = {
  slug: string;
  href: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags: string[];
  project?: string;
  coverImage?: string;
  featured: boolean;
  readingTime: string;
  readingMinutes: number;
};

export type BlogPost = BlogPostMeta & {
  content: string;
  headings: BlogHeading[];
};
