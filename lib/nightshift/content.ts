export const NIGHTSHIFT = {
  name: "NightShift",
  year: "2026",
  category: "Integrated Campaign",
  tagline: "Create after dark.",
  dates: "October 17–18, 2026",
  location: "Harbor Arts District",
  website: "nightshift.example",
  role: "Campaign Designer, Art Director, and Motion Designer",
  tools: ["Photoshop", "Illustrator", "InDesign", "After Effects", "Figma"],
  statement:
    "NightShift reveals the city’s second creative layer—the work, sound, and systems that only become visible after dark.",
  audience: [
    "Young designers",
    "Artists",
    "Developers",
    "Musicians",
    "Students",
    "Gamers",
    "Technology enthusiasts",
    "Creative professionals",
  ],
  concepts: [
    "Night as creative freedom",
    "Technology as a medium",
    "Hidden energy",
    "Shifting perspectives",
    "Collision of art and systems",
  ],
} as const;

export const NIGHTSHIFT_COLORS = [
  {
    name: "Near Black",
    hex: "#07070C",
    rgb: "7, 7, 12",
    use: "Primary campaign field, poster grounds, and environmental fills.",
  },
  {
    name: "Deep Indigo",
    hex: "#14182B",
    rgb: "20, 24, 43",
    use: "Secondary panels, digital ads, and stage-graphic backdrops.",
  },
  {
    name: "Ultraviolet",
    hex: "#6B4DFF",
    rgb: "107, 77, 255",
    use: "Program accents, artist cards, and luminous directional lines.",
  },
  {
    name: "Electric Cyan",
    hex: "#34E8FF",
    rgb: "52, 232, 255",
    use: "Calls to action, schedule highlights, and live-event signals.",
  },
  {
    name: "Signal Yellow",
    hex: "#F5D547",
    rgb: "245, 213, 71",
    use: "Sparse urgency cues—sold-out notices and final countdown only.",
  },
  {
    name: "Off White",
    hex: "#EDEDF2",
    rgb: "237, 237, 242",
    use: "Primary typography, tickets, and high-contrast information.",
  },
] as const;

export const NIGHTSHIFT_POSTERS = [
  {
    id: "main",
    title: "Main announcement",
    label: "Festival",
    accent: "#34E8FF",
    copy: "One weekend. Infinite after-hours.",
  },
  {
    id: "digital",
    title: "Digital-art program",
    label: "Installations",
    accent: "#6B4DFF",
    copy: "Projection, code, and light as material.",
  },
  {
    id: "music",
    title: "Music & performance",
    label: "Live",
    accent: "#34E8FF",
    copy: "Stages that activate the district.",
  },
  {
    id: "workshops",
    title: "Workshops & talks",
    label: "Learn",
    accent: "#F5D547",
    copy: "Systems, craft, and creative technology.",
  },
] as const;

export const NIGHTSHIFT_PHASES = [
  "Announcement",
  "Lineup",
  "Countdown",
  "Live Event",
  "Recap",
] as const;

export const NIGHTSHIFT_SOCIAL = [
  { id: "square", title: "Square post", phase: "Announcement", ratio: "aspect-square" },
  { id: "portrait", title: "Portrait post", phase: "Lineup", ratio: "aspect-[4/5]" },
  { id: "story", title: "Story graphic", phase: "Countdown", ratio: "aspect-[9/16]" },
  { id: "performer", title: "Performer announcement", phase: "Lineup", ratio: "aspect-square" },
  { id: "countdown", title: "Countdown post", phase: "Countdown", ratio: "aspect-square" },
  { id: "schedule", title: "Schedule release", phase: "Announcement", ratio: "aspect-[4/5]" },
  { id: "workshop", title: "Workshop announcement", phase: "Lineup", ratio: "aspect-square" },
  { id: "soldout", title: "Sold-out notice", phase: "Countdown", ratio: "aspect-square" },
  { id: "lastcall", title: "Last-call reminder", phase: "Live Event", ratio: "aspect-[9/16]" },
  { id: "recap", title: "Event recap", phase: "Recap", ratio: "aspect-[4/5]" },
] as const;

export const NIGHTSHIFT_ROLLOUT = [
  { week: "6 weeks out", title: "Launch announcement", note: "Establish the world and the promise of after-dark creation." },
  { week: "5 weeks out", title: "First artist reveal", note: "Introduce names while keeping the campaign frame intact." },
  { week: "4 weeks out", title: "Workshop promotion", note: "Shift toward makers, students, and skill-building." },
  { week: "3 weeks out", title: "Full schedule", note: "Prioritize clarity—dense information with strong hierarchy." },
  { week: "2 weeks out", title: "Ticket urgency", note: "Increase signal yellow sparingly for scarcity moments." },
  { week: "Final week", title: "Countdown", note: "Compress messaging into date, venue, and CTA." },
  { week: "Event days", title: "Live updates", note: "Cyan becomes the live-state accent across screens and stories." },
  { week: "After", title: "Recap", note: "Archive the weekend without losing the nocturnal system." },
] as const;

export const NIGHTSHIFT_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "challenge", label: "Challenge" },
  { id: "audience", label: "Audience" },
  { id: "strategy", label: "Strategy" },
  { id: "system", label: "System" },
  { id: "poster", label: "Poster" },
  { id: "series", label: "Series" },
  { id: "digital", label: "Digital" },
  { id: "social", label: "Social" },
  { id: "tickets", label: "Tickets" },
  { id: "environment", label: "Environment" },
  { id: "merch", label: "Merch" },
  { id: "motion", label: "Motion" },
  { id: "rollout", label: "Rollout" },
  { id: "process", label: "Process" },
  { id: "reflection", label: "Reflection" },
] as const;
