import type { BlogPostMeta } from "./types";

export type GeneratedBlogCover = "novatech" | "event-horizon" | "starlenz";

/**
 * Resolves the editorial cover registered for a post.
 * `coverImage: generated:<id>` is the explicit opt-in; project title is the fallback.
 */
export function getGeneratedCoverKind(
  post: Pick<BlogPostMeta, "coverImage" | "project">,
): GeneratedBlogCover | null {
  const image = post.coverImage?.trim().toLowerCase();
  if (image === "generated:novatech") return "novatech";
  if (image === "generated:event-horizon") return "event-horizon";
  if (image === "generated:starlenz") return "starlenz";

  const project = post.project?.trim().toLowerCase();
  if (project === "novatech" || project === "novatech solutions") return "novatech";
  if (project === "event horizon") return "event-horizon";
  if (project === "starlenz") return "starlenz";
  return null;
}
