export const SITE = {
  name: "Event Horizon",
  tagline: "Discover what's next in your city",
  description:
    "Event Horizon is a modern discovery platform for concerts, conferences, markets, and nights out—curated with clarity and speed.",
  copyright: `© ${new Date().getFullYear()} Event Horizon. All rights reserved.`,
} as const;

export const DEMO_BASE = "/demos/event-horizon";

export const NAV_LINKS = [
  { href: DEMO_BASE, label: "Home" },
  { href: `${DEMO_BASE}/browse`, label: "Browse" },
  { href: `${DEMO_BASE}/favorites`, label: "Favorites" },
  { href: `${DEMO_BASE}/about`, label: "About" },
] as const;
