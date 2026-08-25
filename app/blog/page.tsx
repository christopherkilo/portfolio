import type { Metadata } from "next";
import { BlogCard } from "@/components/blog/BlogCard";
import { TagFilter } from "@/components/blog/TagFilter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getAllPosts, getAllTags, getFeaturedPost } from "@/lib/blog";
import { SITE } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

type PageProps = {
  searchParams: Promise<{ tag?: string }>;
};

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description:
    "Development notes, design decisions, experiments, and lessons from the projects Christopher Kilo is building.",
  path: "/blog",
  ogTitle: `Blog · ${SITE.name}`,
});

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const { tag } = await searchParams;
  const posts = getAllPosts();
  const tags = getAllTags();
  const activeTag = tag && tags.includes(tag) ? tag : undefined;
  const filtered = activeTag
    ? posts.filter((post) => post.tags.includes(activeTag))
    : posts;
  const featured = activeTag ? null : getFeaturedPost();
  const rest = featured
    ? filtered.filter((post) => post.slug !== featured.slug)
    : filtered;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionHeader
        eyebrow="Blog"
        title="Notes from the work in progress"
        description="Development notes, design decisions, experiments, and lessons from the projects I’m building."
      />

      <TagFilter tags={tags} active={activeTag} />

      {featured ? (
        <section className="mb-12" aria-labelledby="featured-writing">
          <h2 id="featured-writing" className="sr-only">
            Featured article
          </h2>
          <BlogCard post={featured} featured />
        </section>
      ) : null}

      {rest.length ? (
        <section aria-labelledby="all-writing">
          <h2
            id="all-writing"
            className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
          >
            {featured ? "More writing" : activeTag ? `Tagged ${activeTag}` : "Articles"}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7">
            {rest.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      {!filtered.length ? (
        <div className="glass-panel rounded-2xl px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold text-text">
            No articles in this category yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">
            Nothing is tagged “{activeTag}” right now. Clear the filter to see the
            latest writing.
          </p>
        </div>
      ) : null}
    </div>
  );
}
