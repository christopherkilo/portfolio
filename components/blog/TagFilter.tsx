"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function chipClass(selected: boolean, quiet = false) {
  return cn(
    "inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    selected
      ? "border-primary/40 bg-primary/10 text-primary"
      : quiet
        ? "border-white/10 bg-white/[0.03] text-muted hover:border-white/20 hover:text-secondary"
        : "border-white/10 bg-white/[0.03] text-secondary hover:border-white/20 hover:text-text",
  );
}

export function TagFilter({
  primary,
  more,
  active,
}: {
  primary: string[];
  more: string[];
  active?: string;
}) {
  const moreActive = Boolean(active && more.includes(active));
  const [expanded, setExpanded] = useState(false);

  if (!primary.length && !more.length) return null;

  return (
    <div className="mb-8" role="navigation" aria-label="Filter by tag">
      <div className="flex flex-wrap gap-2">
        <Link href="/blog" className={chipClass(!active)}>
          All
        </Link>
        {primary.map((tag) => {
          const selected = active === tag;
          return (
            <Link
              key={tag}
              href={selected ? "/blog" : `/blog?tag=${encodeURIComponent(tag)}`}
              className={chipClass(selected)}
            >
              {tag}
            </Link>
          );
        })}
        {moreActive && active && !expanded ? (
          <Link href="/blog" className={chipClass(true)}>
            {active}
          </Link>
        ) : null}
        {more.length ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="blog-more-filters"
            onClick={() => setExpanded((open) => !open)}
            className={chipClass(false, true)}
          >
            {expanded ? "Fewer filters" : "More filters"}
          </button>
        ) : null}
      </div>
      {more.length ? (
        <div
          id="blog-more-filters"
          hidden={!expanded}
          className="mt-2 flex flex-wrap gap-2"
        >
          {more.map((tag) => {
            const selected = active === tag;
            return (
              <Link
                key={tag}
                href={selected ? "/blog" : `/blog?tag=${encodeURIComponent(tag)}`}
                className={chipClass(selected)}
              >
                {tag}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
