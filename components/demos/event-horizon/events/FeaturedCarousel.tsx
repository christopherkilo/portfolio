"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import type { EventItem } from "@/lib/demos/event-horizon/eventData";
import {
  getCategoryAccent,
  getPremiumBadges,
} from "@/lib/demos/event-horizon/categoryStyles";
import { formatEventDate } from "@/lib/demos/event-horizon/utils";
import {
  CategoryBadge,
  PremiumBadgePill,
} from "@/components/demos/event-horizon/ui/PremiumBadge";
import { Button } from "@/components/demos/event-horizon/ui/Button";

type FeaturedCarouselProps = {
  events: EventItem[];
};

export function FeaturedCarousel({ events }: FeaturedCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const count = events.length;
  const current = events[index];

  useEffect(() => {
    if (reducedMotion || paused || count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 4500);
    return () => window.clearInterval(id);
  }, [count, paused, reducedMotion]);

  if (!current) return null;

  const accent = getCategoryAccent(current.category);
  const badges = getPremiumBadges(current).slice(0, 3);

  return (
    <div
      className="eh-featured-panel relative overflow-hidden rounded-3xl transition-[border-color,box-shadow] duration-500"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured events"
      aria-live={paused || reducedMotion ? "polite" : "off"}
      style={{ ["--eh-cat" as string]: accent.color }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={reducedMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.35 }}
          className="grid md:grid-cols-2"
        >
          <div className="relative aspect-[16/11] md:aspect-auto md:min-h-[320px]">
            <Image
              src={current.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent 40%, color-mix(in srgb, ${accent.color} 12%, #0c0c0c) 100%)`,
              }}
              aria-hidden
            />
          </div>
          <div className="relative flex flex-col justify-center p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {badges.map((badge) => (
                <PremiumBadgePill key={badge.kind} badge={badge} />
              ))}
              <CategoryBadge
                category={current.category}
                color={accent.color}
                wash={accent.wash}
                border={accent.border}
              />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight md:text-3xl">
              <span className="sr-only">
                Slide {index + 1} of {count}:{" "}
              </span>
              {current.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
              {current.shortDescription}
            </p>
            <p className="mt-4 inline-flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="eh-glass rounded-full px-2.5 py-1 text-[11px] font-medium text-ink/90">
                {current.venue}, {current.city}
              </span>
              <span>{formatEventDate(current.startDateTime, current.timezone)}</span>
            </p>
            <div className="mt-6">
              <Button href={`/demos/event-horizon/events/${current.slug}`}>
                View event
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          type="button"
          aria-label="Previous featured event"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-bg/70 text-ink backdrop-blur transition hover:border-accent/40 hover:bg-bg hover:shadow-[0_0_18px_-8px_rgba(255,140,43,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => setIndex((i) => (i - 1 + count) % count)}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Next featured event"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-bg/70 text-ink backdrop-blur transition hover:border-accent/40 hover:bg-bg hover:shadow-[0_0_18px_-8px_rgba(255,140,43,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => setIndex((i) => (i + 1) % count)}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
