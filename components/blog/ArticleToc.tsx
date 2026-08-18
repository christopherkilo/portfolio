"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BlogHeading } from "@/lib/blog/types";
import { cn } from "@/lib/utils";

export function ArticleToc({ headings }: { headings: BlogHeading[] }) {
  const [open, setOpen] = useState(false);
  const top = headings.filter((heading) => heading.level === 2);
  if (top.length < 4) return null;

  return (
    <nav
      aria-label="On this page"
      className="blog-toc mb-10 lg:mb-0"
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl lg:sticky lg:top-[var(--scroll-mt)]">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-2 text-left lg:pointer-events-none lg:min-h-0"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            On this page
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted transition lg:hidden",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        <ol
          className={cn(
            "mt-3 space-y-1.5 lg:mt-4 lg:block",
            open ? "block" : "hidden lg:block",
          )}
        >
          {top.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className="block rounded-lg px-2 py-1.5 text-sm leading-snug text-secondary transition hover:bg-white/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {heading.text.replace(/^\d+\.\s+/, "")}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
