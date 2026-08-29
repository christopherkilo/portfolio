import { BlogCard } from "@/components/blog/BlogCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { getLatestPosts } from "@/lib/blog";

export function LatestWriting() {
  const posts = getLatestPosts(3);
  if (!posts.length) return null;

  return (
    <section
      id="writing"
      className="mx-auto max-w-6xl scroll-mt-[var(--scroll-mt)] px-4 py-[var(--section-y)] sm:px-6 lg:px-8"
    >
      <SectionHeader
        className="mb-6 sm:mb-8"
        eyebrow="From the blog"
        title="Latest writing"
        description="Notes on how projects actually evolve — decisions, revisions, and the work between mockup and interface."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      <div className="mt-8">
        <Button href="/blog" variant="outline">
          All articles
        </Button>
      </div>
    </section>
  );
}
