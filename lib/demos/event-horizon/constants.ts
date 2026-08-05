export const SITE = {
  name: "Event Horizon",
  tagline: "Where nights out gather gravity",
  description:
    "Event Horizon is a cinematic discovery platform for concerts, conferences, markets, and nights out—curated with clarity, warmth, and pull.",
  copyright: `© ${new Date().getFullYear()} Event Horizon. All rights reserved.`,
} as const;

export const DEMO_BASE = "/demos/event-horizon";

export const NAV_LINKS = [
  { href: DEMO_BASE, label: "Home" },
  { href: `${DEMO_BASE}/browse`, label: "Browse" },
  { href: `${DEMO_BASE}/tickets`, label: "My Tickets" },
  { href: `${DEMO_BASE}/favorites`, label: "Favorites" },
  { href: `${DEMO_BASE}/about`, label: "About" },
] as const;
