import type { Metadata } from "next";
import { BlogCard } from "@/components/blog/BlogCard";
import { TagFilter } from "@/components/blog/TagFilter";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getAllPosts, getAllTags } from "@/lib/blog";
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
  const requestedTag = tag?.trim() || undefined;
  const knownTag = requestedTag ? tags.includes(requestedTag) : false;
  const invalidTag = Boolean(requestedTag && !knownTag);
  const activeTag = knownTag ? requestedTag : undefined;
  const filtered = invalidTag
    ? []
    : activeTag
      ? posts.filter((post) => post.tags.includes(activeTag))
      : posts;
  const emptyLabel = invalidTag ? requestedTag : activeTag;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionHeader
        as="h1"
        className="mb-6 sm:mb-8"
        eyebrow="Blog"
        title="Notes from the work in progress"
        description="Development notes, design decisions, experiments, and lessons from the projects I’m building."
      />

      <TagFilter tags={tags} active={requestedTag} />

      {filtered.length ? (
        <section aria-labelledby="all-writing">
          <h2
            id="all-writing"
            className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
          >
            {activeTag ? `Tagged ${activeTag}` : "Articles"}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      {!filtered.length ? (
        <div className="glass-panel rounded-2xl px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold text-text">
            {invalidTag ? "No matching tag" : "No articles in this category yet"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">
            {invalidTag ? (
              <>
                There is no tag named “{emptyLabel}”. Clear the filter to see the
                latest writing.
              </>
            ) : (
              <>
                Nothing is tagged “{emptyLabel}” right now. Clear the filter to see
                the latest writing.
              </>
            )}
          </p>
          <div className="mt-6">
            <Button href="/blog" variant="outline">
              All posts
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
