/**
 * Event Horizon artwork resolvers.
 * Prefers per-event generated covers; falls back to category placeholders.
 */

import {
  resolveEventArtworkGallery,
  resolveEventArtworkSrc,
} from "@/lib/demos/event-horizon/artworkCache";
import {
  EVENT_PLACEHOLDER_BASE,
  EVENT_PLACEHOLDER_FILES,
  getEventCategoryPlaceholder,
  resolveEventPlaceholderKey,
  type EventPlaceholderKey,
} from "@/lib/demos/event-horizon/categoryPlaceholders";
import "@/lib/demos/event-horizon/artworkManifest";

export {
  EVENT_PLACEHOLDER_BASE,
  EVENT_PLACEHOLDER_FILES,
  getEventCategoryPlaceholder,
  resolveEventPlaceholderKey,
};
export type { EventPlaceholderKey };

/** Cover image for an event — generated artwork when cached, else category fallback. */
export function resolveEventCoverImage(event: {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  shortDescription?: string;
  category?: string | null;
  image?: string | null;
  tags?: string[];
}): string {
  if (event.slug && event.title && event.category) {
    return resolveEventArtworkSrc({
      id: event.id ?? event.slug,
      slug: event.slug,
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription,
      category: event.category,
      tags: event.tags,
    });
  }
  return getEventCategoryPlaceholder(event.category);
}

/** Detail gallery — generated cover first, then category / default fallbacks. */
export function resolveEventGallery(event: {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  shortDescription?: string;
  category?: string | null;
  gallery?: string[] | null;
  tags?: string[];
}): string[] {
  if (event.slug && event.title && event.category) {
    return resolveEventArtworkGallery({
      id: event.id ?? event.slug,
      slug: event.slug,
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription,
      category: event.category,
      tags: event.tags,
    });
  }
  const primary = getEventCategoryPlaceholder(event.category);
  const fallback = getEventCategoryPlaceholder(null);
  if (primary === fallback) return [primary];
  return [primary, fallback];
}
