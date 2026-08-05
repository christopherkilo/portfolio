"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Ticket, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  getEventPriceLabel,
  getInterestScore,
  type EventItem,
} from "@/lib/demos/event-horizon/eventData";
import {
  getCategoryAccent,
  getPremiumBadges,
} from "@/lib/demos/event-horizon/categoryStyles";
import {
  getBookedPercent,
  getSocialProof,
  getStandoutReason,
  getTicketsRemainingLabel,
  isNearlySoldOut,
} from "@/lib/demos/event-horizon/discovery";
import { formatEventDate, formatEventTime, cn } from "@/lib/demos/event-horizon/utils";
import { useFavorites } from "@/contexts/demos/event-horizon/FavoritesContext";
import { useToast } from "@/contexts/demos/event-horizon/ToastContext";
import { useAuthModal } from "@/contexts/demos/event-horizon/AuthModalContext";
import { cardHover, springHover, staggerItem } from "@/lib/demos/event-horizon/animation";
import {
  CategoryBadge,
  PremiumBadgePill,
} from "@/components/demos/event-horizon/ui/PremiumBadge";

type EventCardProps = {
  event: EventItem;
  className?: string;
  trending?: boolean;
  /** Rail vs grid density */
  variant?: "standard" | "rail";
  /** Section-specific microcopy (timing, staff reason, scarcity) */
  highlight?: string;
  /** Hover preview overlay with summary + reason */
  showPreview?: boolean;
};

export function EventCard({
  event,
  className,
  trending,
  variant = "standard",
  highlight,
  showPreview = true,
}: EventCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const { openSignIn } = useAuthModal();
  const reduced = useReducedMotion();
  const liked = isFavorite(event.id);
  const interest = getInterestScore(event);
  const accent = getCategoryAccent(event.category);
  const badges = getPremiumBadges(event, { trending }).slice(0, 2);
  const social = getSocialProof(event);
  const booked = getBookedPercent(event);
  const nearlyGone = isNearlySoldOut(event);
  const standout = getStandoutReason(event);
  const priceLabel = getEventPriceLabel(event);
  const remainingLabel = getTicketsRemainingLabel(event);

  return (
    <motion.article
      variants={staggerItem}
      whileHover={reduced ? undefined : cardHover}
      transition={springHover}
      data-category={event.category}
      style={{ ["--eh-cat" as string]: accent.color }}
      className={cn(
        "eh-card group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surface/90 shadow-[var(--card-shadow)] backdrop-blur-sm",
        className,
      )}
    >
      <Link
        href={`/demos/event-horizon/events/${event.slug}`}
        className="block"
        aria-label={`${event.title}. ${priceLabel}. ${remainingLabel}.`}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
          <Image
            src={event.image}
            alt=""
            fill
            sizes={
              variant === "rail"
                ? "300px"
                : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            }
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-70 transition-opacity duration-500 group-hover:opacity-95"
            style={{
              background: `linear-gradient(to top, color-mix(in srgb, ${accent.color} 24%, transparent), transparent)`,
            }}
            aria-hidden
          />

          {showPreview ? (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/55 to-black/10 p-3 opacity-0 transition duration-300",
                "group-hover:opacity-100 group-focus-within:opacity-100",
                reduced && "group-hover:opacity-0",
              )}
              aria-hidden={reduced ? true : undefined}
            >
              <p className="line-clamp-2 text-xs leading-relaxed text-ink/95">
                {event.shortDescription}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-bold text-accent">{priceLabel}</span>
                <span className="text-muted">·</span>
                <span className="text-ink/85">{remainingLabel}</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[11px] font-medium text-warm">
                {highlight ?? standout}
              </p>
            </div>
          ) : null}

          <div className="absolute left-3 top-3 z-[1] flex max-w-[85%] flex-wrap gap-1.5">
            <CategoryBadge
              category={event.category}
              color={accent.color}
              wash={accent.wash}
              border={accent.border}
              className="bg-bg/80"
            />
            {trending ? (
              <span className="eh-badge-gold inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold tracking-wide">
                Trending
              </span>
            ) : null}
            {badges
              .filter((badge) => badge.kind !== "trending")
              .slice(0, trending ? 1 : 2)
              .map((badge) => (
                <PremiumBadgePill
                  key={badge.kind}
                  badge={badge}
                  className="bg-bg/75 backdrop-blur"
                />
              ))}
            {nearlyGone ? (
              <span className="rounded-lg border border-highlight/35 bg-bg/85 px-2.5 py-1 text-[11px] font-semibold text-warm backdrop-blur">
                Nearly Sold Out
              </span>
            ) : null}
          </div>
          {event.status !== "upcoming" ? (
            <span className="absolute right-3 top-3 z-[1] rounded-lg border border-highlight/30 bg-bg/85 px-2.5 py-1 text-xs font-semibold capitalize text-warm backdrop-blur">
              {event.status.replace("-", " ")}
            </span>
          ) : booked >= 55 ? (
            <span className="absolute right-3 top-3 z-[1] rounded-lg border border-border bg-bg/80 px-2.5 py-1 text-[11px] font-semibold text-ink/90 backdrop-blur">
              {booked}% booked
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {highlight ? (
              <p className="text-[11px] font-semibold tracking-wide text-accent">
                {highlight}
              </p>
            ) : (
              <p className="text-xs font-medium tracking-wide text-muted">
                {formatEventDate(event.startDateTime, event.timezone)} ·{" "}
                {formatEventTime(event.startDateTime, event.timezone)}
              </p>
            )}
            <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">
              <Link
                href={`/demos/event-horizon/events/${event.slug}`}
                className="transition hover:text-accent"
              >
                {event.title}
              </Link>
            </h3>
            {highlight ? (
              <p className="mt-1 text-xs text-muted">
                {formatEventDate(event.startDateTime, event.timezone)} ·{" "}
                {formatEventTime(event.startDateTime, event.timezone)}
              </p>
            ) : null}
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
                ? "border-warm/40 bg-warm/15 text-warm shadow-[0_0_16px_-6px_rgba(255,194,122,0.5)]"
                : "text-muted hover:border-accent/30 hover:bg-surface-elevated hover:text-ink",
            )}
            aria-label={
              liked
                ? `Remove ${event.title} from favorites`
                : `Add ${event.title} to favorites`
            }
            aria-pressed={liked}
          >
            <Heart className={cn("size-4", liked && "fill-current")} aria-hidden />
          </button>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {event.shortDescription}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="eh-glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]">
            <MapPin
              className="size-3.5"
              style={{ color: accent.color }}
              aria-hidden
            />
            <span className="font-medium text-ink/90">
              {event.venue}, {event.city}
            </span>
          </span>
          <span className="inline-flex items-center gap-1" title="Simulated interest">
            <Users className="size-3.5" aria-hidden />
            {social.interested.toLocaleString()} interested
          </span>
          <span className="inline-flex items-center gap-1">
            <Ticket className="size-3.5" aria-hidden />
            {remainingLabel}
          </span>
          <span className="ml-auto text-sm font-bold text-accent">{priceLabel}</span>
        </div>
        <p className="text-[11px] text-muted">
          {social.friendsAttending} friends attending · {social.communityLabel}
          {interest > 0 ? ` · ${interest.toLocaleString()} reserved` : null}
        </p>
      </div>
    </motion.article>
  );
}
