"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";
import type { EventItem } from "@/lib/demos/event-horizon/eventData";
import { formatEventDate, formatEventTime, cn } from "@/lib/demos/event-horizon/utils";
import { useFavorites } from "@/contexts/demos/event-horizon/FavoritesContext";
import { useToast } from "@/contexts/demos/event-horizon/ToastContext";
import { springHover, staggerItem } from "@/lib/demos/event-horizon/animation";

type EventCardProps = {
  event: EventItem;
  className?: string;
};

export function EventCard({ event, className }: EventCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const liked = isFavorite(event.id);

  return (
    <motion.article
      variants={staggerItem}
      whileHover={{ y: -8 }}
      transition={springHover}
      className={cn(
        "group overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--card-shadow)]",
        className,
      )}
    >
      <Link href={`/demos/event-horizon/events/${event.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
          <Image
            src={event.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-lg bg-bg/80 px-2.5 py-1 text-xs font-semibold text-accent backdrop-blur">
            {event.category}
          </span>
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted">
              {formatEventDate(event.date)} · {formatEventTime(event.date)}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-ink">
              <Link
                href={`/demos/event-horizon/events/${event.id}`}
                className="transition hover:text-accent"
              >
                {event.title}
              </Link>
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              toggleFavorite(event.id);
              toast(
                liked
                  ? `Removed “${event.title}” from favorites`
                  : `Saved “${event.title}” to favorites`,
              );
            }}
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border transition",
              liked
                ? "bg-warm/15 text-warm"
                : "text-muted hover:bg-surface-elevated hover:text-ink",
            )}
            aria-label={liked ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={liked}
          >
            <Heart
              className={cn("size-4", liked && "fill-current")}
              aria-hidden
            />
          </button>
        </div>

        <p className="line-clamp-2 text-sm text-muted">{event.description}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {event.venue}, {event.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            {event.attendees.toLocaleString()} going
          </span>
          <span className="ml-auto font-semibold text-accent">{event.price}</span>
        </div>
      </div>
    </motion.article>
  );
}
