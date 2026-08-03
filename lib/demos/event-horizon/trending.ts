import type { EventItem } from "@/lib/demos/event-horizon/eventData";
import { getInterestScore } from "@/lib/demos/event-horizon/eventData";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/**
 * Eligibility horizon for trending (near-term catalog).
 * Recency still peaks inside the next 7 days so “this week” dominates ranking.
 */
export const TRENDING_WINDOW_DAYS = 45;
/** Soft peak window used for the recency curve (“this week”). */
export const TRENDING_PEAK_DAYS = 7;

/**
 * Rank an event for the home "Trending This Week" section.
 *
 * Score blends four signals (higher is hotter):
 * 1. **Featured** — curated boost for editor picks.
 * 2. **Remaining tickets** — scarcity (lower remaining inventory scores higher).
 * 3. **Popularity** — interest score (capacity minus tickets still available).
 * 4. **Recency** — sooner starts score higher; full weight inside
 *    {@link TRENDING_PEAK_DAYS}, then decays through {@link TRENDING_WINDOW_DAYS}.
 *
 * Cancelled events score 0. Sold-out / postponed events still rank but get a
 * reduced multiplier so they surface as buzz without looking bookable-first.
 */
export function getTrendingScore(
  event: EventItem,
  now: number = Date.now(),
): number {
  if (event.status === "cancelled") return 0;

  const start = Date.parse(event.startDateTime);
  if (!Number.isFinite(start)) return 0;

  const daysUntil = (start - now) / MS_PER_DAY;
  // Past events or beyond the near-term horizon: no trending rank.
  if (daysUntil < -0.5 || daysUntil > TRENDING_WINDOW_DAYS) return 0;

  const remaining = event.ticketTypes.reduce(
    (sum, ticket) => sum + Math.max(ticket.quantityRemaining, 0),
    0,
  );
  const capacity = Math.max(event.capacity, 1);
  const scarcity = 1 - Math.min(remaining / capacity, 1);
  const popularity = getInterestScore(event) / capacity;
  const featuredBoost = event.featured ? 1 : 0;
  // Full recency inside the peak week, then linear decay to the horizon edge.
  const recency =
    daysUntil <= TRENDING_PEAK_DAYS
      ? 1 - Math.min(Math.max(daysUntil, 0) / TRENDING_PEAK_DAYS, 1) * 0.35
      : 0.65 *
        (1 -
          (daysUntil - TRENDING_PEAK_DAYS) /
            (TRENDING_WINDOW_DAYS - TRENDING_PEAK_DAYS));

  let score =
    featuredBoost * 35 +
    scarcity * 30 +
    popularity * 25 +
    recency * 20;

  if (event.status === "sold-out" || event.status === "postponed") {
    score *= 0.65;
  }

  return Math.round(score * 100) / 100;
}

/** Top trending events for the current week window, highest score first. */
export function getTrendingEvents(
  list: EventItem[],
  limit = 6,
  now: number = Date.now(),
): EventItem[] {
  return [...list]
    .map((event) => ({ event, score: getTrendingScore(event, now) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.event.title.localeCompare(b.event.title))
    .slice(0, limit)
    .map((entry) => entry.event);
}
