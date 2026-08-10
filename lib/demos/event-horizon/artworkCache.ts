import { getEventCategoryPlaceholder } from "@/lib/demos/event-horizon/categoryPlaceholders";
import {
  getEventArtworkFingerprint,
  type ArtworkPromptInput,
} from "@/lib/demos/event-horizon/artworkPrompt";

export const EVENT_ARTWORK_BASE = "/placeholders/events/generated";

export type EventArtworkManifestEntry = {
  slug: string;
  fingerprint: string;
  path: string;
  seed: string;
};

export type EventArtworkManifest = {
  version: 1;
  generatedAt: string;
  entries: Record<string, EventArtworkManifestEntry>;
};

let runtimeManifest: EventArtworkManifest | null = null;

export function setEventArtworkManifest(manifest: EventArtworkManifest | null) {
  runtimeManifest = manifest;
}

export function getEventArtworkManifest(): EventArtworkManifest | null {
  return runtimeManifest;
}

export function getGeneratedArtworkPublicPath(slug: string): string {
  return `${EVENT_ARTWORK_BASE}/${slug}.webp`;
}

/**
 * Resolve cover art for an event:
 * 1) Cached generated artwork when fingerprint matches
 * 2) Category placeholder fallback
 */
export function resolveEventArtworkSrc(
  event: ArtworkPromptInput & { image?: string | null },
  manifest: EventArtworkManifest | null = runtimeManifest,
): string {
  const fingerprint = getEventArtworkFingerprint(event);
  const entry = manifest?.entries[event.slug];
  if (entry && entry.fingerprint === fingerprint) {
    return entry.path;
  }
  return getEventCategoryPlaceholder(event.category);
}

export function isEventArtworkStale(
  event: ArtworkPromptInput,
  manifest: EventArtworkManifest | null = runtimeManifest,
): boolean {
  const entry = manifest?.entries[event.slug];
  if (!entry) return true;
  return entry.fingerprint !== getEventArtworkFingerprint(event);
}

export function resolveEventArtworkGallery(
  event: ArtworkPromptInput,
  manifest: EventArtworkManifest | null = runtimeManifest,
): string[] {
  const primary = resolveEventArtworkSrc(event, manifest);
  const category = getEventCategoryPlaceholder(event.category);
  const fallback = getEventCategoryPlaceholder(null);
  const unique = [primary, category, fallback].filter(
    (src, index, list) => list.indexOf(src) === index,
  );
  return unique.slice(0, 3);
}
