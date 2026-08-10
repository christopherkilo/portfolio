import { describe, expect, it } from "vitest";
import {
  EVENT_PLACEHOLDER_BASE,
  EVENT_PLACEHOLDER_FILES,
  getEventCategoryPlaceholder,
  resolveEventCoverImage,
  resolveEventGallery,
  resolveEventPlaceholderKey,
} from "./placeholders";
import { events } from "./eventData";
import { buildEventArtworkPrompt, getEventArtworkFingerprint } from "./artworkPrompt";
import { eventArtworkManifest } from "./artworkManifest";
import { EVENT_ARTWORK_BASE } from "./artworkCache";

describe("event horizon placeholders", () => {
  it("maps known categories to artwork files", () => {
    expect(getEventCategoryPlaceholder("Tech")).toBe(
      `${EVENT_PLACEHOLDER_BASE}/${EVENT_PLACEHOLDER_FILES.tech}`,
    );
    expect(getEventCategoryPlaceholder("Arts")).toBe(
      `${EVENT_PLACEHOLDER_BASE}/${EVENT_PLACEHOLDER_FILES.art}`,
    );
    expect(getEventCategoryPlaceholder("Music")).toBe(
      `${EVENT_PLACEHOLDER_BASE}/${EVENT_PLACEHOLDER_FILES.music}`,
    );
  });

  it("falls back to default for missing or unknown categories", () => {
    expect(resolveEventPlaceholderKey(null)).toBe("default");
    expect(resolveEventPlaceholderKey("")).toBe("default");
    expect(resolveEventPlaceholderKey("Unknown")).toBe("default");
    expect(getEventCategoryPlaceholder(undefined)).toBe(
      `${EVENT_PLACEHOLDER_BASE}/${EVENT_PLACEHOLDER_FILES.default}`,
    );
  });

  it("resolves gallery with generated cover and category fallbacks", () => {
    const event = events.find((item) => item.slug === "aurora-synth-night");
    expect(event).toBeDefined();
    const gallery = resolveEventGallery(event!);
    expect(gallery[0]).toContain(`${EVENT_ARTWORK_BASE}/aurora-synth-night.webp`);
    expect(gallery).toContain(`${EVENT_PLACEHOLDER_BASE}/music.webp`);
  });

  it("applies unique generated artwork across the catalog", () => {
    expect(events.length).toBeGreaterThan(0);
    const covers = new Set<string>();
    for (const event of events) {
      const cover = resolveEventCoverImage(event);
      expect(cover).toBe(event.image);
      expect(cover.startsWith(EVENT_ARTWORK_BASE)).toBe(true);
      expect(cover.endsWith(".webp")).toBe(true);
      covers.add(cover);
      const entry = eventArtworkManifest.entries[event.slug];
      expect(entry).toBeDefined();
      expect(entry.fingerprint).toBe(getEventArtworkFingerprint(event));
    }
    expect(covers.size).toBe(events.length);
  });
});

describe("event artwork prompts", () => {
  it("builds content-aware prompts without text overlays", () => {
    const event = events[0]!;
    const prompt = buildEventArtworkPrompt(event);
    expect(prompt.toLowerCase()).toContain(event.title.toLowerCase().slice(0, 8));
    expect(prompt).toMatch(/No text/i);
    expect(prompt).toMatch(/No logos/i);
    expect(prompt).toMatch(/16:9/);
    expect(prompt).not.toMatch(/cartoon|anime|illustration/i);
  });

  it("keeps fingerprints stable for unchanged content", () => {
    const event = events[0]!;
    expect(getEventArtworkFingerprint(event)).toBe(
      getEventArtworkFingerprint({ ...event }),
    );
  });
});
