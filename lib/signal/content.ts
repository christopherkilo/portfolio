export const SIGNAL = {
  name: "Signal",
  issue: "Issue 01",
  theme: "Human / Machine",
  year: "2026",
  category: "Editorial Design",
  date: "Spring 2026",
  price: "$18 USD",
  role: "Editorial Designer, Art Director, and Information Designer",
  tools: ["InDesign", "Photoshop", "Illustrator", "Figma"],
  description:
    "An independent magazine exploring technology, design, digital culture, and the relationship between people and machines.",
  statement:
    "Signal treats the page as a calibrated instrument—experimental enough for creative readers, disciplined enough for long-form thinking.",
  pageSize: "8.5 × 11 in",
  bleed: "0.125 in",
  colorMode: "CMYK (print) / RGB (digital)",
  resolution: "300 PPI imagery",
} as const;

export const SIGNAL_COLORS = [
  {
    name: "Paper White",
    hex: "#F7F4EF",
    use: "Primary page ground and digital reading surfaces.",
  },
  {
    name: "Rich Black",
    hex: "#121212",
    use: "Display type, body text, and high-contrast photography.",
  },
  {
    name: "Warm Gray",
    hex: "#8A847A",
    use: "Captions, folios, metadata, and secondary hierarchy.",
  },
  {
    name: "Muted Cobalt",
    hex: "#2F4F8A",
    use: "Section markers, links, and quiet editorial accents.",
  },
  {
    name: "Signal Orange",
    hex: "#E85D04",
    use: "Issue-specific accent—cover signal, pull-quote marks, data highlights.",
  },
  {
    name: "Ink Soft",
    hex: "#2A2926",
    use: "Long-form body on paper to reduce optical harshness.",
  },
] as const;

export const SIGNAL_AUDIENCE = [
  "Young designers",
  "Developers",
  "Students",
  "Creative professionals",
  "Technology enthusiasts",
  "Digital-culture readers",
] as const;

export const SIGNAL_VOICE = [
  "Curious, not breathless",
  "Analytical without coldness",
  "Visually confident, verbally clear",
  "Editorial rather than corporate",
] as const;

export const SIGNAL_ARCHITECTURE = [
  { page: "01", title: "Front Cover", kind: "Cover" },
  { page: "02–03", title: "Contents", kind: "Navigation" },
  { page: "04", title: "Editor’s Letter", kind: "Front matter" },
  { page: "05", title: "Contributors", kind: "Front matter" },
  { page: "06–09", title: "Opening Essay — Building a More Human Interface", kind: "Essay" },
  { page: "10–21", title: "Main Feature — The New Creative Machine", kind: "Feature" },
  { page: "22–27", title: "Interview — Designing With Intelligent Tools", kind: "Interview" },
  { page: "28–31", title: "Studio Profile — Inside the Independent Hardware Movement", kind: "Profile" },
  { page: "32–35", title: "Product Review — Five Tools Changing Small Studios", kind: "Review" },
  { page: "36–39", title: "Short News — Field Notes", kind: "News" },
  { page: "40–45", title: "Data Feature — How Creatives Use Technology", kind: "Data" },
  { page: "46–47", title: "Closing Essay — The Cost of Constant Connection", kind: "Essay" },
  { page: "48", title: "Back Cover", kind: "Cover" },
] as const;

export const SIGNAL_TOC = [
  {
    id: "essay",
    section: "Essay",
    title: "Building a More Human Interface",
    author: "Maya Chen",
    page: "06",
    preview: "Hands / interface",
  },
  {
    id: "feature",
    section: "Feature",
    title: "The New Creative Machine",
    author: "Jordan Ellis",
    page: "10",
    preview: "Studio light",
  },
  {
    id: "interview",
    section: "Interview",
    title: "Designing With Intelligent Tools",
    author: "Aisha Okonkwo",
    page: "22",
    preview: "Portrait",
  },
  {
    id: "profile",
    section: "Profile",
    title: "Inside the Independent Hardware Movement",
    author: "Leo Park",
    page: "28",
    preview: "Hardware detail",
  },
  {
    id: "review",
    section: "Review",
    title: "Five Tools Changing Small Studios",
    author: "Sam Rivera",
    page: "32",
    preview: "Product still",
  },
  {
    id: "news",
    section: "News",
    title: "Field Notes",
    author: "Editors",
    page: "36",
    preview: "Grid clips",
  },
  {
    id: "data",
    section: "Data",
    title: "How Creatives Use Technology",
    author: "Signal Research",
    page: "40",
    preview: "Chart field",
  },
  {
    id: "closing",
    section: "Essay",
    title: "The Cost of Constant Connection",
    author: "Nora Blake",
    page: "46",
    preview: "Quiet desk",
  },
] as const;

export const SIGNAL_TYPE_SCALE = [
  {
    role: "Cover title",
    sample: "SIGNAL",
    specs: "Outfit / 92–120 pt / tracking −2% / weight 700",
  },
  {
    role: "Feature headline",
    sample: "The New Creative Machine",
    specs: "Outfit / 42–56 pt / leading 0.95 / weight 600",
  },
  {
    role: "Deck",
    sample: "How studios renegotiate authorship with intelligent systems.",
    specs: "Source Serif 4 / 18–22 pt / leading 1.35",
  },
  {
    role: "Author",
    sample: "Words by Jordan Ellis",
    specs: "JetBrains Mono / 10–11 pt / uppercase tracking 0.16em",
  },
  {
    role: "Body text",
    sample:
      "The tools do not invent taste. They accelerate decisions already forming in the room—sometimes clarifying them, sometimes exposing their absence.",
    specs: "Source Serif 4 / 10.5–11.5 pt print · 18–20 px web / 22–26 pica measure / leading 1.45",
  },
  {
    role: "Subheading",
    sample: "A quieter kind of automation",
    specs: "Outfit / 16–20 pt / weight 600",
  },
  {
    role: "Pull quote",
    sample: "Speed without judgment is just noise with better packaging.",
    specs: "Outfit / 28–36 pt / leading 1.1 / accent rule",
  },
  {
    role: "Caption",
    sample: "Fig. 03 — Prototype console, Portland studio, 2025.",
    specs: "Source Sans 3 / 8–9 pt / warm gray",
  },
  {
    role: "Folio",
    sample: "Signal 01 · 14",
    specs: "JetBrains Mono / 8 pt / outer margin",
  },
  {
    role: "Sidebar",
    sample: "Related: Interface ethics glossary",
    specs: "Source Sans 3 / 9–10 pt / cobalt accent rule",
  },
  {
    role: "Metadata",
    sample: "SPRING 2026 · $18 · ISSUE 01",
    specs: "JetBrains Mono / 9–11 pt / tracking 0.14em",
  },
] as const;

export const SIGNAL_COVERS = [
  {
    id: "primary",
    title: "Final primary cover",
    approach: "Hybrid type + photographic signal",
    note: "Selected for newsstand recognition, theme clarity, and flexible cover-line hierarchy.",
  },
  {
    id: "type",
    title: "Type-led alternative",
    approach: "Oversized issue theme as architecture",
    note: "Strong conceptually, weaker at thumbnail distance without a photographic anchor.",
  },
  {
    id: "image",
    title: "Image-led alternative",
    approach: "Portrait-forward with quiet masthead",
    note: "Emotionally immediate, but less distinctly Signal across a crowded rack.",
  },
] as const;

export const SIGNAL_SPREADS = [
  {
    id: "open",
    title: "Opening spread",
    folio: "10–11",
    kind: "Full-bleed image + title",
  },
  {
    id: "intro",
    title: "Introductory text",
    folio: "12–13",
    kind: "Two-column body + deck",
  },
  {
    id: "image",
    title: "Image-led spread",
    folio: "14–15",
    kind: "Wide photo + narrow caption column",
  },
  {
    id: "quote",
    title: "Pull-quote spread",
    folio: "16–17",
    kind: "Quote as architecture",
  },
  {
    id: "dense",
    title: "Dense editorial",
    folio: "18–19",
    kind: "Three-column + sidebar",
  },
  {
    id: "close",
    title: "Closing spread",
    folio: "20–21",
    kind: "Resolve + next cue",
  },
] as const;

export const SIGNAL_DEPARTMENTS = [
  {
    id: "news",
    title: "Field Notes",
    pattern: "Tight modular cards, bold kicker, 90-word limit",
  },
  {
    id: "profile",
    title: "Studio Profile",
    pattern: "Portrait left, specs rail right, long caption under tools",
  },
  {
    id: "interview",
    title: "Interview",
    pattern: "Q in mono, A in serif, generous pause between exchanges",
  },
  {
    id: "opinion",
    title: "Opinion",
    pattern: "Single column, oversized initial, restrained imagery",
  },
  {
    id: "tools",
    title: "Tools Roundup",
    pattern: "Numbered list, product stills, score chips",
  },
  {
    id: "closing",
    title: "Closing Essay",
    pattern: "Quiet margins, longer measure, minimal chrome",
  },
] as const;

export const SIGNAL_SURVEY = {
  disclaimer:
    "Data shown for editorial-design demonstration purposes. Figures are fictional sample data created for this case study.",
  tools: [
    { name: "Figma", value: 34 },
    { name: "Code editors", value: 22 },
    { name: "Adobe CC", value: 18 },
    { name: "3D / game", value: 14 },
    { name: "Other", value: 12 },
  ],
  screenTime: [
    { label: "<4 hrs", value: 12 },
    { label: "4–6 hrs", value: 28 },
    { label: "6–8 hrs", value: 36 },
    { label: "8+ hrs", value: 24 },
  ],
  environment: [
    { name: "Home studio", value: 41 },
    { name: "Coworking", value: 23 },
    { name: "Office", value: 19 },
    { name: "Hybrid / cafe", value: 17 },
  ],
  automationConcern: [
    { name: "High", value: 31 },
    { name: "Moderate", value: 44 },
    { name: "Low", value: 25 },
  ],
  aiUse: [
    { name: "Weekly+", value: 48 },
    { name: "Monthly", value: 27 },
    { name: "Rarely", value: 18 },
    { name: "Never", value: 7 },
  ],
  valuedTrait: [
    { name: "Reliability", value: 29 },
    { name: "Speed", value: 21 },
    { name: "Transparency", value: 26 },
    { name: "Craft control", value: 24 },
  ],
  summaries: [
    "Primary creative tools: Figma leads at 34%, followed by code editors at 22%.",
    "Average daily screen time clusters between six and eight hours (36%).",
    "Most respondents work from a home studio (41%).",
    "Automation concern is mostly moderate (44%), with 31% reporting high concern.",
    "Nearly half use AI tools weekly or more (48%).",
    "Reliability (29%) and transparency (26%) edge out speed as valued traits.",
  ],
} as const;

export const SIGNAL_PRODUCTION = [
  { label: "Page size", value: "8.5 × 11 inches (trim)" },
  { label: "Bleed", value: "0.125 inch on all sides" },
  { label: "Safe area", value: "0.25 inch inside trim for critical type" },
  { label: "Color mode", value: "CMYK for print; RGB exports for digital edition" },
  { label: "Imagery", value: "300 PPI at final size; convert profiles before soft-proof" },
  { label: "Paragraph styles", value: "Body, Deck, Caption, Pull Quote, Sidebar, Folio" },
  { label: "Character styles", value: "Emphasis, Small Caps Meta, Link Accent, Score Chip" },
  { label: "Master pages", value: "A-Feature, B-Departments, C-Data, D-Covers" },
  { label: "Preflight", value: "Overset text, missing links, image resolution, ink limit" },
  { label: "Export", value: "PDF/X-1a for press; interactive PDF + web article for digital" },
] as const;

export const SIGNAL_PROCESS = [
  { title: "Editorial brief", note: "Define Human / Machine as a lens, not a gadget issue." },
  { title: "Audience definition", note: "Designers and developers who want depth without academic density." },
  { title: "Content map", note: "Sequence from orientation → feature gravity → departments → reflection." },
  { title: "Thumbnail sketches", note: "Early thumbnails establishing rhythm before detailed comps." },
  { title: "Grid tests", note: "12-column master with flexible 2/3/4/6 combinations." },
  { title: "Type pairing", note: "Outfit + Source Serif 4 + JetBrains Mono locked after readability tests." },
  { title: "Cover alternatives", note: "Three directions refined; hybrid selected for shelf clarity." },
  { title: "Layout revisions", note: "Dense spreads gained a sidebar escape hatch for breathing room." },
  { title: "Final system", note: "Masters, styles, and department patterns documented for Issue 02." },
] as const;

export const SIGNAL_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "challenge", label: "Challenge" },
  { id: "audience", label: "Audience" },
  { id: "architecture", label: "Architecture" },
  { id: "grid", label: "Grid" },
  { id: "typography", label: "Type" },
  { id: "color", label: "Color" },
  { id: "cover", label: "Cover" },
  { id: "toc", label: "Contents" },
  { id: "feature", label: "Feature" },
  { id: "departments", label: "Departments" },
  { id: "review", label: "Review" },
  { id: "data", label: "Data" },
  { id: "print", label: "Print" },
  { id: "digital", label: "Digital" },
  { id: "production", label: "Production" },
  { id: "process", label: "Process" },
  { id: "reflection", label: "Reflection" },
] as const;

export const FEATURE_COPY = {
  deck: "How studios renegotiate authorship, craft, and pace when intelligent tools enter the room.",
  author: "Jordan Ellis",
  pullQuote: "Speed without judgment is just noise with better packaging.",
  body: [
    "Creative work has always depended on instruments. What changed is not the presence of tools, but the speed at which they propose options before a team has finished asking the question.",
    "In rooms we visited for this issue, the most useful systems were not the loudest. They were the ones that made constraints visible—time, materials, audience, ethics—so people could decide with clearer eyes.",
    "The new creative machine is less a replacement for authorship than a pressure test of taste. When generation becomes cheap, selection becomes the craft.",
  ],
} as const;
