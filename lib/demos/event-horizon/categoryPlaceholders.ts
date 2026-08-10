/**
 * Category-level promotional placeholders (fallback when per-event art is missing).
 */

export const EVENT_PLACEHOLDER_BASE = "/placeholders/events";

export const EVENT_PLACEHOLDER_FILES = {
  tech: "tech.webp",
  music: "music.webp",
  art: "art.webp",
  food: "food.webp",
  sports: "sports.webp",
  business: "business.webp",
  comedy: "comedy.webp",
  community: "community.webp",
  education: "education.webp",
  nightlife: "nightlife.webp",
  default: "default.webp",
} as const;

export type EventPlaceholderKey = keyof typeof EVENT_PLACEHOLDER_FILES;

const CATEGORY_ALIAS_TO_KEY: Record<string, EventPlaceholderKey> = {
  tech: "tech",
  technology: "tech",
  music: "music",
  art: "art",
  arts: "art",
  food: "food",
  sports: "sports",
  sport: "sports",
  business: "business",
  comedy: "comedy",
  community: "community",
  education: "education",
  nightlife: "nightlife",
  night: "nightlife",
};

export function resolveEventPlaceholderKey(
  category?: string | null,
): EventPlaceholderKey {
  if (!category) return "default";
  const normalized = category.trim().toLowerCase();
  return CATEGORY_ALIAS_TO_KEY[normalized] ?? "default";
}

export function getEventCategoryPlaceholder(
  category?: string | null,
): string {
  const key = resolveEventPlaceholderKey(category);
  return `${EVENT_PLACEHOLDER_BASE}/${EVENT_PLACEHOLDER_FILES[key]}`;
}
