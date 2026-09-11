import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getAllCaseStudyIds } from "@/lib/caseStudies";
import { absoluteUrl } from "@/lib/seo";

const STATIC_PATHS = [
  "/",
  "/projects",
  "/work",
  "/blog",
  "/about",
  "/resume",
  "/contact",
  "/toolkit",
  "/projects/event-horizon-brand",
  "/projects/voltline",
  "/projects/nightshift",
  "/projects/signal-magazine",
  "/projects/starlenz",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const caseStudies = getAllCaseStudyIds().map((id) => `/projects/${id}`);
  const posts = getAllPosts().map((post) => post.href);
  const paths = [...STATIC_PATHS, ...caseStudies, ...posts];
  const unique = [...new Set(paths)];

  return unique.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
  }));
}
