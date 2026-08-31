"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { BlogGeneratedCover } from "@/components/blog/BlogGeneratedCover";
import { InDevBadge } from "@/components/blog/InDevBadge";
import { Badge } from "@/components/ui/Badge";
import { Shimmer } from "@/components/ui/Shimmer";
import { formatBlogDate } from "@/lib/blog/dates";
import type { BlogPostMeta } from "@/lib/blog/types";
import { springHover } from "@/lib/animation";
import { cn } from "@/lib/utils";

export function BlogCard({ post }: { post: BlogPostMeta }) {
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
            "gradient-border glass-panel group relative flex h-full flex-col overflow-hidden rounded-[var(--radius)]",
            hovered &&
              "brightness-[1.04] shadow-[0_28px_60px_-28px_rgba(0,0,0,0.45),0_0_40px_-20px_var(--glow-yellow)]",
          )}
        >
        <Link
          href={post.href}
          className="relative z-[1] flex h-full flex-col rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label={`Read article: ${post.title}`}
        >

        <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
          <BlogGeneratedCover post={post} className="absolute inset-0" />
          <span className="absolute right-3 top-3 z-[2] inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-text opacity-0 backdrop-blur-md transition duration-[var(--duration-card)] group-hover:opacity-100 group-focus-within:opacity-100">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>

        <div className="relative z-[2] flex flex-1 flex-col gap-4 p-6 sm:p-7">
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
            <h3 className="line-clamp-2 font-display text-xl font-semibold tracking-tight text-text transition-colors duration-[var(--duration-fast)] group-hover:text-primary sm:text-2xl">
              {post.title}
            </h3>
            <p className="mt-3 line-clamp-3 max-w-prose text-sm leading-relaxed text-secondary md:text-[0.95rem]">
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
              {post.tags.slice(0, 4).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : null}

          <p className="mt-auto pt-1 text-sm font-medium text-muted transition duration-[var(--duration-fast)] group-hover:text-primary">
            Read article →
          </p>
        </div>
        </Link>
      </article>
      </Shimmer>
    </motion.div>
  );
}
