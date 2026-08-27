"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { formatBlogDate } from "@/lib/blog/dates";
import type { BlogPostMeta } from "@/lib/blog/types";
import { EventHorizonBlogCover } from "@/components/blog/EventHorizonBlogCover";
import { InDevBadge } from "@/components/blog/InDevBadge";
import { StarLenzBlogCover } from "@/components/blog/StarLenzBlogCover";
import { Badge } from "@/components/ui/Badge";
import { Shimmer } from "@/components/ui/Shimmer";
import { springHover } from "@/lib/animation";
import { cn } from "@/lib/utils";

function Cover({ post, featured }: { post: BlogPostMeta; featured?: boolean }) {
  const generatedStarLenz =
    post.coverImage === "generated:starlenz" ||
    (!post.coverImage && post.project === "StarLenz");
  const generatedEventHorizon =
    post.coverImage === "generated:event-horizon" ||
    (!post.coverImage && post.project === "Event Horizon");

  if (generatedStarLenz) {
    return <StarLenzBlogCover className="absolute inset-0" />;
  }
  if (generatedEventHorizon) {
    return <EventHorizonBlogCover className="absolute inset-0" />;
  }

  return (
    <div className="absolute inset-0 grid place-items-center bg-surface-elevated">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {featured ? "Featured" : "Article"}
      </span>
    </div>
  );
}

export function BlogCard({
  post,
  featured = false,
}: {
  post: BlogPostMeta;
  featured?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHovered(false);
        }
      }}
      whileHover={reducedMotion ? undefined : { y: -6 }}
      transition={springHover}
    >
      <Shimmer className="h-full rounded-[var(--radius)]" onPress={false}>
        <article
          className={cn(
            "gradient-border glass-panel group relative flex h-full overflow-hidden rounded-[var(--radius)]",
            featured
              ? "flex-col md:flex-row md:min-h-[20rem]"
              : "flex-col",
            hovered &&
              "brightness-[1.04] shadow-[0_28px_60px_-28px_rgba(0,0,0,0.45),0_0_40px_-20px_var(--glow-yellow)]",
          )}
        >
        <Link
          href={post.href}
          className="absolute inset-0 z-[1] rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label={`Read article: ${post.title}`}
        />

        <div
          className={cn(
            "relative overflow-hidden bg-surface-elevated",
            featured
              ? "aspect-[16/10] md:aspect-auto md:w-[46%] md:min-h-[22rem]"
              : "aspect-[16/10]",
          )}
        >
          <Cover post={post} featured={featured} />
          <span className="absolute right-3 top-3 z-[2] inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-text opacity-0 backdrop-blur-md transition duration-[var(--duration-card)] group-hover:opacity-100 group-focus-within:opacity-100">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>

        <div
          className={cn(
            "relative z-[2] flex flex-1 flex-col gap-4 p-6 sm:p-7",
            featured && "md:justify-center md:p-8 lg:p-10",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            {post.project ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--glow-yellow)]" aria-hidden />
                {post.project}
              </span>
            ) : null}
            {post.project === "StarLenz" ? <InDevBadge /> : null}
          </div>

          <div>
            <h2
              className={cn(
                "font-display font-semibold tracking-tight text-text transition-colors duration-[var(--duration-fast)] group-hover:text-primary",
                featured
                  ? "text-2xl sm:text-3xl md:text-[2.1rem] md:leading-tight"
                  : "text-xl sm:text-2xl",
              )}
            >
              {post.title}
            </h2>
            <p
              className={cn(
                "mt-3 max-w-prose leading-relaxed text-secondary",
                featured ? "text-base md:text-lg" : "line-clamp-3 text-sm md:text-[0.95rem]",
              )}
            >
              {post.description}
            </p>
          </div>

          <p className="text-sm text-muted">
            <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
            <span aria-hidden> · </span>
            <span>{post.readingTime}</span>
          </p>

          {post.tags.length ? (
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, featured ? 6 : 4).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : null}

          <p className="mt-auto pt-1 text-sm font-medium text-muted transition duration-[var(--duration-fast)] group-hover:text-primary">
            Read article →
          </p>
        </div>
      </article>
      </Shimmer>
    </motion.div>
  );
}
