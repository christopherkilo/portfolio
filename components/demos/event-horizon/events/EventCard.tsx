"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";
import {
  getEventPriceLabel,
  getInterestScore,
  type EventItem,
} from "@/lib/demos/event-horizon/eventData";
import { formatEventDate, formatEventTime, cn } from "@/lib/demos/event-horizon/utils";
import { useFavorites } from "@/contexts/demos/event-horizon/FavoritesContext";
import { useToast } from "@/contexts/demos/event-horizon/ToastContext";
import { useAuthModal } from "@/contexts/demos/event-horizon/AuthModalContext";
import { springHover, staggerItem } from "@/lib/demos/event-horizon/animation";

type EventCardProps = {
  event: EventItem;
  className?: string;
};

export function EventCard({ event, className }: EventCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const { openSignIn } = useAuthModal();
  const liked = isFavorite(event.id);
  const interest = getInterestScore(event);

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
      <Link href={`/demos/event-horizon/events/${event.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
            <Image
              src={event.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          <span className="absolute left-3 top-3 rounded-lg bg-bg/80 px-2.5 py-1 text-xs font-semibold text-accent backdrop-blur">
            {event.category}
          </span>
          {event.status !== "upcoming" ? (
            <span className="absolute right-3 top-3 rounded-lg bg-bg/85 px-2.5 py-1 text-xs font-semibold capitalize text-warm backdrop-blur">
              {event.status.replace("-", " ")}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted">
              {formatEventDate(event.startDateTime, event.timezone)} ·{" "}
              {formatEventTime(event.startDateTime, event.timezone)}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-ink">
              <Link
                href={`/demos/event-horizon/events/${event.slug}`}
                className="transition hover:text-accent"
              >
                {event.title}
              </Link>
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              void (async () => {
                const result = await toggleFavorite(event.id);
                if (result === "auth") {
                  openSignIn({
                    type: "favorite",
                    eventId: event.id,
                    eventSlug: event.slug,
                  });
                  return;
                }
                if (result === "error") {
                  toast("We could not update favorites. Please try again.");
                  return;
                }
                toast(
                  liked
                    ? `Removed “${event.title}” from favorites`
                    : `Saved “${event.title}” to favorites`,
                );
              })();
            }}
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              liked
                ? "bg-warm/15 text-warm"
                : "text-muted hover:bg-surface-elevated hover:text-ink",
            )}
            aria-label={
              liked
                ? `Remove ${event.title} from favorites`
                : `Add ${event.title} to favorites`
            }
            aria-pressed={liked}
          >
            <Heart
              className={cn("size-4", liked && "fill-current")}
              aria-hidden
            />
          </button>
        </div>

        <p className="line-clamp-2 text-sm text-muted">
          {event.shortDescription}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {event.venue}, {event.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            {interest.toLocaleString()} reserved
          </span>
          <span className="ml-auto font-semibold text-accent">
            {getEventPriceLabel(event)}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
