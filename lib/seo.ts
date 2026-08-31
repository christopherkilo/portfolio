import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export function absoluteUrl(path: string): string {
  if (!path || path === "/") return SITE.url;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  images?: NonNullable<NonNullable<Metadata["openGraph"]>["images"]>;
  robots?: Metadata["robots"];
  type?: "website" | "article";
  /** Skip the root `title.template` (homepage only). */
  absoluteTitle?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  ogTitle,
  images,
  robots,
  type = "website",
  absoluteTitle = false,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const resolvedTitle = ogTitle ?? title;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url,
      title: resolvedTitle,
      description,
      siteName: SITE.name,
      locale: "en_US",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      ...(images ? { images } : {}),
    },
    ...(robots ? { robots } : {}),
  };
}
