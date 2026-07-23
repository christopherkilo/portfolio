"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { EventItem } from "@/lib/demos/event-horizon/eventData";
import { formatEventDate } from "@/lib/demos/event-horizon/utils";

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

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured events"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
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
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Featured · {current.category}
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold md:text-3xl">
              {current.title}
            </h3>
            <p className="mt-3 text-sm text-muted md:text-base">
              {current.description}
            </p>
            <p className="mt-4 text-sm text-muted">
              {formatEventDate(current.date)} · {current.venue}, {current.city}
            </p>
            <Link
              href={`/demos/event-horizon/events/${current.id}`}
              className="mt-6 inline-flex h-11 w-fit items-center rounded-xl bg-accent px-5 text-sm font-semibold text-on-accent transition hover:bg-accent-strong"
            >
              View event
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          type="button"
          aria-label="Previous featured event"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-bg/70 text-ink backdrop-blur hover:bg-bg"
          onClick={() => setIndex((i) => (i - 1 + count) % count)}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Next featured event"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-bg/70 text-ink backdrop-blur hover:bg-bg"
          onClick={() => setIndex((i) => (i + 1) % count)}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
