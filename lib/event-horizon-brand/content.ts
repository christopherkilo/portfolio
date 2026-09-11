export const EH_BRAND = {
  name: "Event Horizon",
  title: "Event Horizon — Brand Identity",
  year: "2026",
  category: "Brand Identity",
  statement: "Where nights out gather gravity.",
  principle: "Warm darkness — people and experiences pulled toward the horizon.",
  role: "Brand Identity / Graphic Design",
  scope: "Identity system, campaign, event collateral, merchandise",
  product: "Event discovery platform",
} as const;

export const EH_BRAND_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "problem", label: "Problem" },
  { id: "territory", label: "Territory" },
  { id: "identity", label: "Identity" },
  { id: "color", label: "Color" },
  { id: "type", label: "Type" },
  { id: "language", label: "Language" },
  { id: "events", label: "Events" },
  { id: "posters", label: "Posters" },
  { id: "merch", label: "Merchandise" },
  { id: "bridge", label: "Bridge" },
  { id: "close", label: "System" },
  { id: "reflection", label: "Reflection" },
] as const;

export const EH_BRAND_COLORS = [
  {
    name: "Void",
    hex: "#0B0B0B",
    use: "Primary field. Night, print, apparel.",
    primary: true,
  },
  {
    name: "Horizon",
    hex: "#FF8C2B",
    use: "The gravitational accent. Rings, rules, wayfinding.",
    primary: true,
  },
  {
    name: "Warm White",
    hex: "#F4F0EB",
    use: "Type on dark. Canvas. Paper edges.",
    primary: true,
  },
  {
    name: "Charcoal",
    hex: "#171717",
    use: "Elevated dark surfaces.",
    primary: false,
  },
  {
    name: "Elevated",
    hex: "#232323",
    use: "Cards, panels, secondary fields.",
    primary: false,
  },
  {
    name: "Ember",
    hex: "#FF7A00",
    use: "Heat in the orange family. Never a fill for the mark.",
    primary: false,
  },
  {
    name: "Amber Glow",
    hex: "#FFC27A",
    use: "Highlights on the horizon line.",
    primary: false,
  },
  {
    name: "Warm Gray",
    hex: "#8A8178",
    use: "Captions and quiet labels.",
    primary: false,
  },
] as const;
