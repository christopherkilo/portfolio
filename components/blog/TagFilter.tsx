import Link from "next/link";
import { cn } from "@/lib/utils";

export function TagFilter({
  tags,
  active,
}: {
  tags: string[];
  active?: string;
}) {
  if (!tags.length) return null;

  return (
    <div className="mb-8 flex flex-wrap gap-2" role="navigation" aria-label="Filter by tag">
      <Link
        href="/blog"
        className={cn(
          "inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          !active
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-white/10 bg-white/[0.03] text-secondary hover:border-white/20 hover:text-text",
        )}
      >
        All
      </Link>
      {tags.map((tag) => {
        const selected = active === tag;
        return (
          <Link
            key={tag}
            href={selected ? "/blog" : `/blog?tag=${encodeURIComponent(tag)}`}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              selected
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-white/10 bg-white/[0.03] text-secondary hover:border-white/20 hover:text-text",
            )}
          >
            {tag}
          </Link>
        );
      })}
    </div>
  );
}
