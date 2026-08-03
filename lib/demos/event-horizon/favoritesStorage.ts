import { events } from "@/lib/demos/event-horizon/eventData";

export const FAVORITES_STORAGE_KEY = "event-horizon-favorites";

export function getKnownEventIds(
  catalog: { id: string }[] = events,
): Set<string> {
  return new Set(catalog.map((event) => event.id));
}

/**
 * Validate favorite IDs from Local Storage.
 * Drops non-strings, duplicates, empty values, and IDs that no longer exist.
 */
export function sanitizeFavoriteIds(
  raw: unknown,
  knownIds: Set<string> = getKnownEventIds(),
): string[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const item of raw) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (!id || seen.has(id) || !knownIds.has(id)) continue;
    seen.add(id);
    cleaned.push(id);
  }

  return cleaned;
}

/** Load favorites from a storage snapshot string (or null). */
export function loadFavoritesFromStorage(
  raw: string | null,
  knownIds: Set<string> = getKnownEventIds(),
): string[] {
  if (raw == null || raw === "") return [];
  try {
    return sanitizeFavoriteIds(JSON.parse(raw) as unknown, knownIds);
  } catch {
    return [];
  }
}
