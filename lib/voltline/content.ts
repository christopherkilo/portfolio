export const VOLTLINE = {
  name: "Voltline",
  year: "2026",
  category: "Brand Identity",
  statement: "Precision tools for high-performance work.",
  role: "Brand Designer, Art Director, and Visual Systems Designer",
  tools: ["Adobe Illustrator", "Photoshop", "InDesign", "Figma"],
  audience: [
    "Developers",
    "Designers",
    "Content creators",
    "Technology enthusiasts",
    "Remote professionals",
    "PC builders",
  ],
  values: ["Precision", "Reliability", "Performance", "Clarity", "Intentional design"],
  keywords: [
    "Modular",
    "Aligned",
    "Forward",
    "Technical",
    "Quiet energy",
    "Premium restraint",
  ],
} as const;

export const VOLTLINE_COLORS = [
  {
    name: "Carbon Black",
    hex: "#0A0A0A",
    rgb: "10, 10, 10",
    use: "Primary surfaces, packaging fields, and logo lockups on light grounds.",
  },
  {
    name: "Graphite",
    hex: "#1A1A1A",
    rgb: "26, 26, 26",
    use: "Secondary panels, interface cards, and elevated dark surfaces.",
  },
  {
    name: "Soft White",
    hex: "#F4F4F1",
    rgb: "244, 244, 241",
    use: "Primary text on dark grounds, stationery stock, and packaging highlights.",
  },
  {
    name: "Electric Lime",
    hex: "#C8FF3D",
    rgb: "200, 255, 61",
    use: "Calls to action, active states, product identifiers, and key accents only.",
  },
  {
    name: "Steel Gray",
    hex: "#6E737A",
    rgb: "110, 115, 122",
    use: "Supporting labels, captions, and secondary UI chrome.",
  },
  {
    name: "Smoke Gray",
    hex: "#2C2F34",
    rgb: "44, 47, 52",
    use: "Dividers, technical frames, and subdued diagram backgrounds.",
  },
  {
    name: "Muted Silver",
    hex: "#B7BCC3",
    rgb: "183, 188, 195",
    use: "Specification typography, icons, and quiet metallic cues.",
  },
] as const;

export const VOLTLINE_PRODUCTS = [
  {
    id: "axis",
    name: "Axis Mechanical Keyboard",
    tagline: "Low-latency typing for long sessions",
    accent: "#C8FF3D",
    specs: ["Hot-swap", "Gasket mount", "USB-C", "Aluminum top"],
  },
  {
    id: "pulse",
    name: "Pulse Performance Mouse",
    tagline: "Sensor clarity with quiet actuation",
    accent: "#9AD1FF",
    specs: ["26K DPI", "69 g", "PTFE feet", "2.4 GHz / BT"],
  },
  {
    id: "core",
    name: "Core USB-C Hub",
    tagline: "Desk expansion without cable chaos",
    accent: "#FFC46B",
    specs: ["8 ports", "100W PD", "4K HDMI", "SD / microSD"],
  },
] as const;

export const VOLTLINE_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "challenge", label: "Challenge" },
  { id: "audience", label: "Audience" },
  { id: "concept", label: "Concept" },
  { id: "logo", label: "Logo" },
  { id: "color", label: "Color" },
  { id: "type", label: "Typography" },
  { id: "language", label: "Language" },
  { id: "applications", label: "Applications" },
  { id: "packaging", label: "Packaging" },
  { id: "social", label: "Social" },
  { id: "guidelines", label: "Guidelines" },
  { id: "reflection", label: "Reflection" },
] as const;

export const VOLTLINE_CONCEPTS = [
  {
    title: "Signal Flow",
    status: "Rejected",
    note: "Too close to literal data-stream metaphors and felt like a SaaS dashboard brand.",
  },
  {
    title: "Hardware Module",
    status: "Explored",
    note: "Useful for packaging grids, but the symbol became overly complex at small sizes.",
  },
  {
    title: "Aligned V/L",
    status: "Selected",
    note: "A modular V form with a compact L counterweight communicates forward motion without a lightning cliché.",
  },
] as const;

export const VOLTLINE_DONT = [
  "Do not stretch or compress the wordmark.",
  "Do not place Electric Lime behind the full logotype on product faces.",
  "Do not add drop shadows, glows, or outline treatments to the mark.",
  "Do not rearrange the symbol and wordmark into unapproved lockups.",
] as const;
