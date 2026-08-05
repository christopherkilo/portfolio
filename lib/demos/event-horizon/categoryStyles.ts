import type { EventCategory, EventItem, TicketAvailability } from "@/lib/demos/event-horizon/eventData";

/**
 * Content accents — brand orange stays global; events get quiet personality colors.
 * Values tuned for dark graphite surfaces (readable, never neon-dominant).
 */
export type CategoryAccent = {
  /** Display / CSS color */
  color: string;
  /** Soft wash for badges & chips */
  wash: string;
  /** Border / ring */
  border: string;
  /** Accessible label for non-color cues */
  label: string;
};

export const CATEGORY_ACCENTS: Record<EventCategory, CategoryAccent> = {
  Music: {
    color: "#e879a9",
    wash: "rgba(192, 38, 122, 0.16)",
    border: "rgba(232, 121, 169, 0.4)",
    label: "Music",
  },
  Tech: {
    color: "#67e8f9",
    wash: "rgba(34, 211, 238, 0.12)",
    border: "rgba(103, 232, 249, 0.38)",
    label: "Technology",
  },
  Arts: {
    color: "#fda4af",
    wash: "rgba(251, 113, 133, 0.14)",
    border: "rgba(253, 164, 175, 0.4)",
    label: "Art",
  },
  Food: {
    color: "#ffd54a",
    wash: "rgba(255, 213, 74, 0.14)",
    border: "rgba(255, 213, 74, 0.45)",
    label: "Food",
  },
  Sports: {
    color: "#6ee7b7",
    wash: "rgba(52, 211, 153, 0.12)",
    border: "rgba(110, 231, 183, 0.38)",
    label: "Sports",
  },
  Nightlife: {
    color: "#c4b5fd",
    wash: "rgba(139, 92, 246, 0.16)",
    border: "rgba(196, 181, 253, 0.4)",
    label: "Nightlife",
  },
};

export function getCategoryAccent(category: EventCategory): CategoryAccent {
  return CATEGORY_ACCENTS[category];
}

export type PremiumBadgeKind =
  | "featured"
  | "trending"
  | "editors-pick"
  | "vip"
  | "exclusive"
  | "limited";

export type PremiumBadge = {
  kind: PremiumBadgeKind;
  label: string;
};

const BADGE_LABELS: Record<PremiumBadgeKind, string> = {
  featured: "Featured",
  trending: "Trending",
  "editors-pick": "Editor's Pick",
  vip: "VIP",
  exclusive: "Exclusive",
  limited: "Limited",
};

export function getPremiumBadges(
  event: EventItem,
  options?: { trending?: boolean },
): PremiumBadge[] {
  const badges: PremiumBadge[] = [];

  if (event.featured) {
    badges.push({ kind: "featured", label: BADGE_LABELS.featured });
  }
  if (options?.trending) {
    badges.push({ kind: "trending", label: BADGE_LABELS.trending });
  }

  const tags = event.tags.map((t) => t.toLowerCase());
  if (tags.some((t) => t.includes("exclusive") || t === "members")) {
    badges.push({ kind: "exclusive", label: BADGE_LABELS.exclusive });
  }
  if (tags.some((t) => t === "vip" || t.includes("vip"))) {
    badges.push({ kind: "vip", label: BADGE_LABELS.vip });
  }
  if (tags.some((t) => t.includes("editor"))) {
    badges.push({ kind: "editors-pick", label: BADGE_LABELS["editors-pick"] });
  }

  const hasLimited = event.ticketTypes.some(
    (t) => (t.availability as TicketAvailability) === "limited",
  );
  if (hasLimited && event.status === "upcoming") {
    badges.push({ kind: "limited", label: BADGE_LABELS.limited });
  }

  // Deduplicate by kind, preserve order
  const seen = new Set<PremiumBadgeKind>();
  return badges.filter((b) => {
    if (seen.has(b.kind)) return false;
    seen.add(b.kind);
    return true;
  });
}
