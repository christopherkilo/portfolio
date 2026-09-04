"use client";

import { EventHorizonBlogCover } from "@/components/blog/EventHorizonBlogCover";
import { NovaTechBlogCover } from "@/components/blog/NovaTechBlogCover";
import { StarLenzBlogCover } from "@/components/blog/StarLenzBlogCover";
import { TaskFlowBlogCover } from "@/components/blog/TaskFlowBlogCover";
import { getGeneratedCoverKind } from "@/lib/blog/covers";
import type { BlogPostMeta } from "@/lib/blog/types";

export function BlogGeneratedCover({
  post,
  className,
}: {
  post: Pick<BlogPostMeta, "coverImage" | "project" | "title">;
  className?: string;
}) {
  const kind = getGeneratedCoverKind(post);

  if (kind === "novatech") {
    return <NovaTechBlogCover className={className} showTitle={false} />;
  }
  if (kind === "event-horizon") {
    return <EventHorizonBlogCover className={className} showTitle={false} />;
  }
  if (kind === "starlenz") {
    return <StarLenzBlogCover className={className} showTitle={false} />;
  }
  if (kind === "taskflow") {
    return <TaskFlowBlogCover className={className} showTitle={false} />;
  }

  return (
    <div className="absolute inset-0 grid place-items-center bg-surface-elevated">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        Article
      </span>
    </div>
  );
}
