import { BlogCard } from "@/components/blog/BlogCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { getLatestPosts } from "@/lib/blog";

export function LatestWriting() {
  const posts = getLatestPosts(3);
  if (!posts.length) return null;

  const [featured, ...rest] = posts;
  const single = rest.length === 0;

  return (
    <section
      id="writing"
      className="mx-auto max-w-6xl scroll-mt-[var(--scroll-mt)] px-4 py-[var(--section-y)] sm:px-6 lg:px-8"
    >
      <SectionHeader
        eyebrow="From the blog"
        title="Latest writing"
        description="Notes on how projects actually evolve — decisions, revisions, and the work between mockup and interface."
      />

      <BlogCard post={featured} featured={single} />

      {rest.length ? (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {rest.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        <Button href="/blog" variant="outline">
          All articles
        </Button>
      </div>
    </section>
  );
}
