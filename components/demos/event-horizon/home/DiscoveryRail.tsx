"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { EventCard } from "@/components/demos/event-horizon/events/EventCard";
import type { DiscoverySection } from "@/lib/demos/event-horizon/discovery";
import { cn } from "@/lib/demos/event-horizon/utils";

type DiscoveryRailProps = {
  section: DiscoverySection;
  trendingIds?: Set<string>;
  className?: string;
};

export function DiscoveryRail({
  section,
  trendingIds,
  className,
}: DiscoveryRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = Math.min(320, node.clientWidth * 0.8);
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <section
      className={cn("eh-discovery-section relative", className)}
      aria-labelledby={`rail-${section.id}-title`}
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {section.eyebrow}
          </p>
          <h2
            id={`rail-${section.id}-title`}
            className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {section.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {section.description}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label={`Scroll ${section.title} left`}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface/80 text-ink transition hover:border-accent/40 hover:shadow-[0_0_18px_-8px_rgba(255,140,43,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => scrollBy(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${section.title} right`}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface/80 text-ink transition hover:border-accent/40 hover:shadow-[0_0_18px_-8px_rgba(255,140,43,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => scrollBy(1)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <Button href={section.viewAllHref} variant="outline" size="sm">
            {section.viewAllLabel ?? "View all"}
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="eh-rail -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 pt-1 scroll-smooth sm:-mx-0 sm:px-0"
        tabIndex={0}
        role="list"
        aria-label={section.title}
      >
        {section.events.map((event) => (
          <div
            key={event.id}
            role="listitem"
            className="w-[min(86vw,300px)] shrink-0 snap-start sm:w-[300px]"
          >
            <EventCard
              event={event}
              variant="rail"
              trending={trendingIds?.has(event.id)}
              highlight={section.highlights?.[event.id]}
              showPreview
            />
          </div>
        ))}
      </div>

      <div className="mt-4 sm:hidden">
        <Button href={section.viewAllHref} variant="outline" size="sm" className="w-full">
          {section.viewAllLabel ?? "View all"}
        </Button>
      </div>
    </section>
  );
}
