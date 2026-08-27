import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { ArticleFooter } from "@/components/blog/ArticleFooter";
import { ArticleToc } from "@/components/blog/ArticleToc";
import { InDevBadge } from "@/components/blog/InDevBadge";
import { EventHorizonBlogCover } from "@/components/blog/EventHorizonBlogCover";
import { StarLenzBlogCover } from "@/components/blog/StarLenzBlogCover";
import { Badge } from "@/components/ui/Badge";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  formatBlogDate,
  getAdjacentPosts,
  getPostBySlug,
  getPostSlugs,
  getRelatedProject,
} from "@/lib/blog";
import { SITE } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Article" };

  return {
    ...pageMetadata({
      title: post.title,
      description: post.description,
      path: post.href,
      type: "article",
    }),
    openGraph: {
      type: "article",
      url: `${SITE.url}${post.href}`,
      title: post.title,
      description: post.description,
      publishedTime: `${post.date}T00:00:00.000Z`,
      modifiedTime: post.updated
        ? `${post.updated}T00:00:00.000Z`
        : undefined,
      authors: [SITE.name],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedProject(post.project);
  const { previous, next } = getAdjacentPosts(post.slug);
  const showStarLenzCover =
    post.coverImage === "generated:starlenz" ||
    (!post.coverImage && post.project === "StarLenz");
  const showEventHorizonCover =
    post.coverImage === "generated:event-horizon" ||
    (!post.coverImage && post.project === "Event Horizon");

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: {
      "@type": "Person",
      name: SITE.name,
      url: SITE.url,
    },
    publisher: {
      "@type": "Person",
      name: SITE.name,
      url: SITE.url,
    },
    mainEntityOfPage: `${SITE.url}${post.href}`,
    keywords: post.tags.join(", "),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <JsonLd data={articleJsonLd} />
      <nav className="mb-8">
        <Link
          href="/blog"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-secondary transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Blog
        </Link>
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(0,46rem)_14rem] lg:justify-center lg:gap-12">
        <article>
          <header className="mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {post.project ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <span
                    className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--glow-yellow)]"
                    aria-hidden
                  />
                  {post.project}
                </span>
              ) : null}
              {post.project === "StarLenz" ? <InDevBadge /> : null}
            </div>

            <h1 className="max-w-[22ch] font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
              {post.title}
            </h1>
            <p className="mt-4 max-w-[40rem] text-base leading-relaxed text-secondary md:text-lg md:leading-[1.7]">
              {post.description}
            </p>

            <p className="mt-5 text-sm text-muted">
              {post.updated ? (
                <>
                  Originally published{" "}
                  <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                  <span aria-hidden> · </span>
                  Updated{" "}
                  <time dateTime={post.updated}>{formatBlogDate(post.updated)}</time>
                </>
              ) : (
                <>
                  <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                </>
              )}
              <span aria-hidden> · </span>
              {post.readingTime}
            </p>

            {post.tags.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            ) : null}

            {showStarLenzCover ? (
              <div className="blog-shot relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-white/10">
                <StarLenzBlogCover className="absolute inset-0" />
              </div>
            ) : null}
            {showEventHorizonCover ? (
              <div className="blog-shot relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-white/10">
                <EventHorizonBlogCover className="absolute inset-0" />
              </div>
            ) : null}
          </header>

          <div className="lg:hidden">
            <ArticleToc headings={post.headings} />
          </div>

          <ArticleBody content={post.content} />
          <ArticleFooter related={related} previous={previous} next={next} />
        </article>

        <aside className="hidden lg:block">
          <ArticleToc headings={post.headings} />
        </aside>
      </div>
    </div>
  );
}
