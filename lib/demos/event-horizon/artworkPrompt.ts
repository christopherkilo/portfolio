import type { EventCategory } from "@/lib/demos/event-horizon/eventData";

export type ArtworkPromptInput = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  category: EventCategory | string;
  venue?: string;
  city?: string;
  tags?: string[];
};

const STYLE_SUFFIX =
  "Professional promotional artwork for premium event marketing. 16:9 cinematic composition, realistic photography aesthetic, high detail, modern high-contrast color grading, soft bokeh and subtle lens bloom, website hero artwork. No text, no logos, no watermarks, no brand marks, no readable signage.";

const CATEGORY_VISUALS: Record<string, string[]> = {
  Tech: [
    "LED screens",
    "developers and builders",
    "modern conference stage",
    "cool blue and cyan lighting",
    "innovation atmosphere",
  ],
  Music: [
    "concert stage",
    "crowd energy",
    "lasers and neon",
    "dynamic stage lighting",
    "immersive sound-and-light atmosphere",
  ],
  Arts: [
    "gallery architecture",
    "art installations",
    "minimal creative spaces",
    "elegant creative lighting",
    "refined cultural atmosphere",
  ],
  Food: [
    "beautiful dishes",
    "warm inviting lighting",
    "outdoor festival market energy",
    "restaurant atmosphere",
    "appetizing cinematic food styling",
  ],
  Sports: [
    "stadium or athletic venue",
    "motion and action",
    "athletes in movement",
    "high-energy atmosphere",
    "bright competitive lighting",
  ],
  Nightlife: [
    "premium lounge",
    "city night atmosphere",
    "warm neon accents",
    "cocktail culture",
    "fashionable after-dark mood",
  ],
  Business: [
    "networking professionals",
    "conference center",
    "luxury venue interiors",
    "clean keynote lighting",
  ],
  Comedy: [
    "spotlight on stage",
    "microphone stand",
    "intimate theater audience",
    "warm amber comedy-club lighting",
  ],
  Community: [
    "local market gathering",
    "families and neighbors",
    "outdoor activities",
    "warm afternoon light",
  ],
  Education: [
    "workshop collaboration",
    "presentation screens",
    "students interacting",
    "focused learning atmosphere",
  ],
};

function uniquePhrases(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function inferAtmosphere(input: ArtworkPromptInput): string[] {
  const titleTags = [input.title, ...(input.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const body = [input.shortDescription, input.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const blob = `${titleTags} ${body}`;
  const category = String(input.category);

  const hints: string[] = [];
  if (/sunset|dusk|golden hour|golden-hour/.test(blob)) {
    hints.push("sunset golden-hour light");
  }
  if (/sunrise|dawn/.test(blob)) hints.push("soft dawn light");
  if (/rooftop|skyline/.test(blob)) hints.push("city skyline backdrop");
  if (/outdoor|open-air|yard|pier|park|amphitheater|alley/.test(blob)) {
    hints.push("open-air venue");
  }
  if (/intimate|chamber|members|lounge|amber room/.test(blob)) {
    hints.push("intimate premium interior");
  }
  if (
    category === "Music" ||
    category === "Nightlife" ||
    /neon|laser|projection|synth|electronic|dj/.test(titleTags)
  ) {
    if (/neon|laser|projection|synth|electronic|dj/.test(blob)) {
      hints.push("neon and projection-mapped lighting");
    }
  }
  if (/jazz|acoustic|chamber/.test(blob)) hints.push("warm live-music ambience");
  if (
    category === "Nightlife" ||
    /comedy|stand-up|standup|stand up/.test(blob)
  ) {
    if (/comedy|stand-up|standup|stand up/.test(blob)) {
      hints.push("comedy-club spotlight mood");
    }
  }
  if (category === "Food" || /\b(food|chef|tasting|culinary)\b/.test(titleTags)) {
    hints.push("appetizing culinary atmosphere");
  }
  if (category === "Sports" && /yoga|fitness|flow/.test(blob)) {
    hints.push("calm wellness atmosphere");
  }
  if (/film|cinema|shorts/.test(blob)) hints.push("outdoor cinema at dusk");
  if (
    category === "Tech" &&
    /workshop|makers|hardware|prototyp/.test(blob)
  ) {
    hints.push("hands-on maker workshop energy");
  }
  if (/lantern/.test(blob)) hints.push("glowing lantern paths");
  return hints;
}

function categoryEnhancements(category: string): string[] {
  return CATEGORY_VISUALS[category] ?? CATEGORY_VISUALS.Arts ?? [];
}

/**
 * Build a deterministic promotional artwork prompt from event content.
 * Avoids cartoon/anime/illustration language; emphasizes cinematic realism.
 */
export function buildEventArtworkPrompt(input: ArtworkPromptInput): string {
  const concepts = uniquePhrases([
    `Premium promotional artwork for "${input.title}"`,
    input.shortDescription,
    input.description
      ? input.description.split(/(?<=[.!?])\s+/)[0]
      : undefined,
    input.venue ? `set at ${input.venue}` : undefined,
    input.city ? `in ${input.city}` : undefined,
    ...(input.tags ?? []).slice(0, 5),
    ...inferAtmosphere(input),
    ...categoryEnhancements(String(input.category)),
    "cinematic depth",
    "professional event marketing photography",
    "ultra detailed",
    "photorealistic",
  ]);

  return `${concepts.join(", ")}. ${STYLE_SUFFIX}`;
}

/** Stable seed for an event — unrelated UI state must not change artwork. */
export function getEventArtworkSeed(input: {
  id: string;
  slug: string;
}): string {
  return input.id || input.slug;
}

/**
 * Content fingerprint — regenerate only when title, description, or category change.
 */
export function getEventArtworkFingerprint(input: {
  slug: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category: string;
}): string {
  const payload = [
    input.slug,
    input.category,
    input.title.trim(),
    (input.shortDescription ?? "").trim(),
    (input.description ?? "").trim(),
  ].join("\u001f");

  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `eh_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
