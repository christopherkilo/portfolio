"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, MapPin, Ticket } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  getExternalEventCtaHref,
  type PublicExternalEvent,
} from "@/lib/demos/event-horizon/externalEvents";
import { getEventCategoryPlaceholder } from "@/lib/demos/event-horizon/categoryPlaceholders";
import { getCategoryAccent } from "@/lib/demos/event-horizon/categoryStyles";
import { formatEventDate, formatEventTime, cn } from "@/lib/demos/event-horizon/utils";
import type { EventCategory } from "@/lib/demos/event-horizon/eventData";
import { cardHover, springHover, staggerItem } from "@/lib/demos/event-horizon/animation";
import { CATEGORIES } from "@/lib/demos/event-horizon/eventData";

type ExternalEventCardProps = {
  event: PublicExternalEvent;
  className?: string;
};

export function ExternalEventCard({ event, className }: ExternalEventCardProps) {
  const reduced = useReducedMotion();
  const mappedCategory = mapTicketmasterCategory(event.category);
  const accent = mappedCategory
    ? getCategoryAccent(mappedCategory)
    : {
        color: "#ff8c2b",
        wash: "rgba(255, 140, 43, 0.14)",
        border: "rgba(255, 140, 43, 0.4)",
      };
  const placeholder = getEventCategoryPlaceholder(event.category ?? mappedCategory);
  const imageSrc = event.imageUrl || placeholder;
  const ctaHref = getExternalEventCtaHref(event);
  const location = [event.venueName, event.city, event.state].filter(Boolean).join(", ");

  return (
    <motion.article
      variants={staggerItem}
      whileHover={reduced ? undefined : cardHover}
      transition={springHover}
      className={cn(
        "eh-card group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surface/90 shadow-[var(--card-shadow)] backdrop-blur-sm",
        className,
      )}
      data-event-source="ticketmaster"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        <ExternalEventImage src={imageSrc} fallback={placeholder} />
        <div className="absolute left-3 top-3 z-[1] flex max-w-[90%] flex-wrap gap-1.5">
          <span className="rounded-lg border border-accent/35 bg-bg/85 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-accent backdrop-blur">
            Ticketmaster
          </span>
          {event.category ? (
            <span
              className="rounded-lg border bg-bg/80 px-2.5 py-1 text-[11px] font-semibold backdrop-blur"
              style={{
                borderColor: accent.border,
                color: accent.color,
                backgroundColor: accent.wash,
              }}
            >
              {event.category}
            </span>
          ) : null}
          {event.genre ? (
            <span className="rounded-lg border border-border bg-bg/80 px-2.5 py-1 text-[11px] font-medium text-ink/90 backdrop-blur">
              {event.genre}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted">
            {formatEventDate(event.startsAt, "America/Chicago")} ·{" "}
            {formatEventTime(event.startsAt, "America/Chicago")}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">
            {ctaHref ? (
              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-accent"
              >
                {event.title}
              </a>
            ) : (
              event.title
            )}
          </h3>
        </div>

        {location ? (
          <p className="eh-glass inline-flex w-fit max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-muted">
            <MapPin className="size-3.5 shrink-0" style={{ color: accent.color }} aria-hidden />
            <span className="truncate font-medium text-ink/90">{location}</span>
          </p>
        ) : null}

        <p className="text-[11px] text-muted">
          Listed by Ticketmaster. Event Horizon does not sell these tickets.
        </p>

        <div className="mt-auto">
          {ctaHref ? (
            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="eh-btn-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"
            >
              <Ticket className="size-4" aria-hidden />
              View Tickets
              <ExternalLink className="size-3.5 opacity-80" aria-hidden />
            </a>
          ) : (
            <p className="text-sm text-muted">Ticket link unavailable.</p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function ExternalEventImage({ src, fallback }: { src: string; fallback: string }) {
  const [current, setCurrent] = useState(src);

  return (
    <Image
      src={current}
      alt=""
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
      aria-hidden
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
      className="object-cover transition duration-500 group-hover:scale-[1.04]"
    />
  );
}

function mapTicketmasterCategory(value?: string): EventCategory | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return CATEGORIES.find(
    (category) =>
      category.toLowerCase() === normalized || normalized.includes(category.toLowerCase()),
  );
}
