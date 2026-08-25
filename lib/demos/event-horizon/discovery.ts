import {
  events,
  getInterestScore,
  getLowestTicketPrice,
  isUpcomingEvent,
  type EventCategory,
  type EventItem,
} from "@/lib/demos/event-horizon/eventData";
import { getTrendingEvents } from "@/lib/demos/event-horizon/trending";

export type DiscoverySection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  viewAllHref: string;
  viewAllLabel?: string;
  events: EventItem[];
  /** Optional per-event highlight shown on cards in this rail */
  highlights?: Record<string, string>;
};

function remainingTickets(event: EventItem): number {
  return event.ticketTypes.reduce(
    (sum, ticket) => sum + Math.max(ticket.quantityRemaining, 0),
    0,
  );
}

/** 0–100 share of capacity already claimed (simulated interest + inventory). */
export function getBookedPercent(event: EventItem): number {
  const capacity = Math.max(event.capacity, 1);
  const remaining = remainingTickets(event);
  return Math.max(
    0,
    Math.min(100, Math.round(((capacity - remaining) / capacity) * 100)),
  );
}

export function getTicketsRemainingLabel(event: EventItem): string {
  const remaining = remainingTickets(event);
  if (event.status === "sold-out" || remaining <= 0) return "Sold out";
  if (remaining <= 25) return `${remaining} tickets left`;
  if (remaining <= 80) return "Limited availability";
  return `${remaining.toLocaleString()} tickets open`;
}

export function isNearlySoldOut(event: EventItem): boolean {
  return (
    event.status === "upcoming" &&
    getBookedPercent(event) >= 78 &&
    remainingTickets(event) > 0
  );
}

/** Stable simulated social proof from event inventory + id. */
export function getSocialProof(event: EventItem): {
  interested: number;
  friendsAttending: number;
  communityLabel: string;
} {
  const interested = Math.max(
    24,
    getInterestScore(event) + (event.id.charCodeAt(0) % 40),
  );
  const friendsAttending = 4 + (event.id.length % 11);
  const booked = getBookedPercent(event);
  let communityLabel = "Local favorite";
  if (event.featured) communityLabel = "Community favorite";
  else if (booked >= 70) communityLabel = "Popular this weekend";
  else if (event.tags.some((t) => t.includes("family")))
    communityLabel = "Perfect for groups";
  return { interested, friendsAttending, communityLabel };
}

export function getStandoutReason(event: EventItem): string {
  if (STAFF_PICK_REASONS[event.id]) return STAFF_PICK_REASONS[event.id];
  if (isNearlySoldOut(event)) return "Almost sold out — don’t wait.";
  if (event.featured) return "Aspirational pick from our editors.";
  if (getLowestTicketPrice(event) === 0) return "Free entry — RSVP while open.";
  if (event.tags.some((t) => t.includes("outdoor")))
    return "Great atmosphere under open sky.";
  if (event.category === "Nightlife") return "Elevated night-out energy.";
  if (event.category === "Food") return "Perfect for first-time visitors.";
  if (event.category === "Music") return "A night worth dressing up for.";
  return "Worth exploring this week.";
}

export function getTimingLabel(
  event: EventItem,
  now: number = Date.now(),
): string | null {
  const start = Date.parse(event.startDateTime);
  if (!Number.isFinite(start)) return null;
  const hours = (start - now) / (60 * 60 * 1000);
  if (hours < -6) return null;
  if (hours < 0) return "Happening now";
  if (hours <= 2.5) return `Starts in ${Math.max(1, Math.round(hours))} hour${Math.round(hours) === 1 ? "" : "s"}`;
  if (hours <= 8) return "Doors Open Soon";
  const startDay = new Date(start).toDateString();
  const nowDay = new Date(now).toDateString();
  if (startDay === nowDay) return "Starts Tonight";
  return null;
}

export function getFreshnessLabel(event: EventItem, now: number = Date.now()): string | null {
  const announced = ANNOUNCED_AT[event.id];
  if (!announced) return null;
  const days = (now - Date.parse(announced)) / (24 * 60 * 60 * 1000);
  if (days <= 1.2) return "Added Today";
  if (days <= 7) return "New This Week";
  if (days <= 14) return "Recently Announced";
  return "Fresh Discoveries";
}

/** Curated staff-pick blurbs — discovery layer only (not Prisma). */
export const STAFF_PICK_REASONS: Record<string, string> = {
  "aurora-synth-night": "Great atmosphere — analog warmth with a late-night pull.",
  "velvet-room-sessions": "Intimate, elevated, and perfect for a special night out.",
  "canvas-after-dark": "Perfect for first-time visitors exploring local art.",
  "taste-of-the-grid": "Community favorite with chef pop-ups under string lights.",
  "pulse-film-garden": "Quiet luxury — shorts under the stars with director Q&As.",
  "harbor-run-classic": "Finish-line energy and skyline views worth waking up for.",
  "harbor-lights-festival": "Lantern paths and waterfront glow — bring the whole group.",
  "neon-lane-sessions": "Popular tonight in Austin — alley energy with late bass.",
  "skyline-rooftop-market": "Sunset tastings above the city — dress for the view.",
  "cedar-chamber-night": "Quiet luxury: unamplified sound in a wood-lined hall.",
};

/** Simulated announce dates for “Just Announced”. Kept in the recent past relative to Aug 24, 2026. */
export const ANNOUNCED_AT: Record<string, string> = {
  "aurora-synth-night": "2026-08-18T12:00:00Z",
  "frontier-dev-summit": "2026-08-12T15:00:00Z",
  "canvas-after-dark": "2026-08-16T10:00:00Z",
  "taste-of-the-grid": "2026-08-22T18:00:00Z",
  "harbor-run-classic": "2026-08-10T09:00:00Z",
  "velvet-room-sessions": "2026-08-19T20:00:00Z",
  "circuit-makers-lab": "2026-08-23T14:00:00Z",
  "pulse-film-garden": "2026-08-23T16:00:00Z",
  "orbit-community-cup": "2026-08-11T11:00:00Z",
  "amber-room-comedy": "2026-08-21T09:00:00Z",
  "skyline-rooftop-market": "2026-08-22T11:30:00Z",
  "foundry-after-hours": "2026-08-20T20:00:00Z",
  "neon-lane-sessions": "2026-08-21T08:00:00Z",
  "cedar-chamber-night": "2026-08-17T12:00:00Z",
  "lumen-yoga-dawn": "2026-08-15T07:00:00Z",
  "harbor-lights-festival": "2026-08-20T10:00:00Z",
};

function byCategory(list: EventItem[], category: EventCategory): EventItem[] {
  return list.filter(
    (event) => event.category === category && event.status !== "cancelled",
  );
}

function isLiveTonight(event: EventItem, now: number): boolean {
  if (event.status === "cancelled") return false;
  const start = Date.parse(event.startDateTime);
  if (!Number.isFinite(start)) return false;
  const hours = (start - now) / (60 * 60 * 1000);
  return hours >= -4 && hours <= 18;
}

function isWeekendish(event: EventItem, now: number): boolean {
  const start = Date.parse(event.startDateTime);
  if (!Number.isFinite(start)) return false;
  const days = (start - now) / (24 * 60 * 60 * 1000);
  if (days < -0.2 || days > 5) return false;
  const day = new Date(start).getDay();
  return day === 5 || day === 6 || day === 0 || days <= 3;
}

function justAnnounced(list: EventItem[], now: number): EventItem[] {
  return [...list]
    .filter((event) => ANNOUNCED_AT[event.id])
    .sort(
      (a, b) =>
        Date.parse(ANNOUNCED_AT[b.id]!) - Date.parse(ANNOUNCED_AT[a.id]!),
    )
    .filter((event) => {
      const days = (now - Date.parse(ANNOUNCED_AT[event.id]!)) / (24 * 60 * 60 * 1000);
      return days <= 10;
    })
    .slice(0, 8);
}

function staffPicks(list: EventItem[]): EventItem[] {
  const ids = Object.keys(STAFF_PICK_REASONS);
  return ids
    .map((id) => list.find((event) => event.id === id))
    .filter((event): event is EventItem => Boolean(event))
    .slice(0, 8);
}

function freeEvents(list: EventItem[]): EventItem[] {
  return list.filter((event) => getLowestTicketPrice(event) === 0).slice(0, 8);
}

function underPrice(list: EventItem[], max: number): EventItem[] {
  return list
    .filter((event) => {
      const price = getLowestTicketPrice(event);
      return price !== null && price > 0 && price <= max;
    })
    .slice(0, 8);
}

function familyFriendly(list: EventItem[]): EventItem[] {
  return list
    .filter((event) =>
      event.tags.some((tag) =>
        ["family-friendly", "community", "outdoors", "weekend"].includes(tag),
      ),
    )
    .slice(0, 8);
}

function lateNight(list: EventItem[]): EventItem[] {
  return list
    .filter((event) => {
      if (event.category === "Nightlife") return true;
      const hour = new Date(event.startDateTime).getHours();
      return hour >= 19 || event.tags.some((t) => t.includes("nightlife") || t === "21+");
    })
    .slice(0, 8);
}

/** Build curated homepage rails — living discovery, not a flat list. */
export function getHomeDiscoverySections(
  list: EventItem[] = events,
  now: number = Date.now(),
): DiscoverySection[] {
  const active = list.filter((event) => isUpcomingEvent(event, now));
  const trending = getTrendingEvents(active, 10, now);
  const tonight = active.filter((event) => isLiveTonight(event, now)).slice(0, 8);
  const weekend = trending.filter((event) => isWeekendish(event, now));
  const weekendRail = (weekend.length >= 4 ? weekend : trending).slice(0, 10);

  const music = byCategory(active, "Music");
  const sections: DiscoverySection[] = [
    {
      id: "trending-weekend",
      eyebrow: "Don’t miss this weekend",
      title: "Trending This Weekend",
      description: "What’s pulling the crowd — scarcity, buzz, and nights worth planning around.",
      viewAllHref: "/demos/event-horizon/browse?sort=popular",
      viewAllLabel: "View all",
      events: weekendRail,
      highlights: Object.fromEntries(
        weekendRail.map((event) => {
          const booked = getBookedPercent(event);
          const label = isNearlySoldOut(event)
            ? "Nearly Sold Out"
            : booked >= 60
              ? `${booked}% booked`
              : `Trending in ${event.city}`;
          return [event.id, label];
        }),
      ),
    },
    {
      id: "live-tonight",
      eyebrow: "Happening tonight",
      title: "Live Tonight",
      description: "Doors, countdowns, and experiences starting before the night ends.",
      viewAllHref: "/demos/event-horizon/browse?sort=date-asc",
      events: tonight,
      highlights: Object.fromEntries(
        tonight.map((event) => [
          event.id,
          getTimingLabel(event, now) ?? "Starts Tonight",
        ]),
      ),
    },
    {
      id: "staff-picks",
      eyebrow: "Editor’s lens",
      title: "Staff Picks",
      description: "Hand-chosen nights with a short reason to go.",
      viewAllHref: "/demos/event-horizon/browse?featured=true",
      events: staffPicks(active),
      highlights: STAFF_PICK_REASONS,
    },
    {
      id: "just-announced",
      eyebrow: "Fresh discoveries",
      title: "Just Announced",
      description: "New on the horizon — be early while tickets are open.",
      viewAllHref: "/demos/event-horizon/browse?sort=date-asc",
      events: justAnnounced(active, now),
      highlights: Object.fromEntries(
        justAnnounced(active, now).map((event) => [
          event.id,
          getFreshnessLabel(event, now) ?? "Recently Announced",
        ]),
      ),
    },
    {
      id: "because-music",
      eyebrow: "Because you liked Music",
      title: "More nights with a pulse",
      description: "Sounds and rooms that keep the momentum going.",
      viewAllHref: "/demos/event-horizon/browse?category=Music",
      events: music.slice(0, 8),
    },
    {
      id: "arts-culture",
      eyebrow: "Arts & Culture",
      title: "Arts & Culture",
      description: "Galleries, film, and evenings made for lingering.",
      viewAllHref: "/demos/event-horizon/browse?category=Arts",
      events: byCategory(active, "Arts"),
    },
    {
      id: "food-drink",
      eyebrow: "Food & Drink",
      title: "Food & Drink",
      description: "Markets, tastings, and tables worth dressing for.",
      viewAllHref: "/demos/event-horizon/browse?category=Food",
      events: byCategory(active, "Food"),
    },
    {
      id: "conferences",
      eyebrow: "Conferences & Networking",
      title: "Conferences & Networking",
      description: "Rooms where builders meet — talks, labs, and after-hours.",
      viewAllHref: "/demos/event-horizon/browse?category=Tech",
      events: byCategory(active, "Tech"),
    },
    {
      id: "sports",
      eyebrow: "Sports & Fitness",
      title: "Sports & Fitness",
      description: "Races, cups, and mornings that earn the weekend.",
      viewAllHref: "/demos/event-horizon/browse?category=Sports",
      events: byCategory(active, "Sports"),
    },
    {
      id: "late-night",
      eyebrow: "After dark",
      title: "Late Night Picks",
      description: "Lounges, late sets, and nights that stretch past midnight.",
      viewAllHref: "/demos/event-horizon/browse?category=Nightlife",
      events: lateNight(active),
    },
    {
      id: "under-25",
      eyebrow: "Near your budget",
      title: "Under $25",
      description: "Strong nights that stay approachable.",
      viewAllHref: "/demos/event-horizon/browse?sort=popular",
      events: underPrice(active, 25),
    },
    {
      id: "free",
      eyebrow: "No ticket stress",
      title: "Free events",
      description: "RSVP, show up, and keep the evening open.",
      viewAllHref: "/demos/event-horizon/browse",
      events: freeEvents(active),
    },
    {
      id: "groups",
      eyebrow: "Perfect for groups",
      title: "Family friendly & communal",
      description: "Bring people — markets, cups, and open-air gatherings.",
      viewAllHref: "/demos/event-horizon/browse",
      events: familyFriendly(active),
    },
  ];

  return sections.filter((section) => section.events.length > 0);
}

export function getFeaturedDiscoveryEvents(
  list: EventItem[] = events,
  now: number = Date.now(),
): EventItem[] {
  const upcoming = list.filter((event) => isUpcomingEvent(event, now));
  const preferred = [
    "aurora-synth-night",
    "velvet-room-sessions",
    "harbor-lights-festival",
    "frontier-dev-summit",
    "taste-of-the-grid",
    "pulse-film-garden",
    "skyline-rooftop-market",
  ];
  const featured = preferred
    .map((id) => upcoming.find((event) => event.id === id && event.featured))
    .filter((event): event is EventItem => Boolean(event));
  if (featured.length >= 3) return featured;
  return upcoming.filter((event) => event.featured);
}
