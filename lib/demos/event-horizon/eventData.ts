export type EventCategory =
  | "Music"
  | "Tech"
  | "Arts"
  | "Food"
  | "Sports"
  | "Nightlife";

export interface EventItem {
  id: string;
  title: string;
  category: EventCategory;
  description: string;
  longDescription: string;
  date: string;
  location: string;
  city: string;
  venue: string;
  price: string;
  image: string;
  gallery: string[];
  featured: boolean;
  attendees: number;
  organizer: string;
}

export const CATEGORIES: EventCategory[] = [
  "Music",
  "Tech",
  "Arts",
  "Food",
  "Sports",
  "Nightlife",
];

export const CITIES = [
  "Austin",
  "Chicago",
  "Seattle",
  "Denver",
  "Miami",
  "Brooklyn",
] as const;

export const events: EventItem[] = [
  {
    id: "aurora-synth-night",
    title: "Aurora Synth Night",
    category: "Music",
    description:
      "An immersive evening of live synthwave, neon visuals, and open-air lounges.",
    longDescription:
      "Aurora Synth Night brings together rising electronic artists for a night of analog warmth and futuristic sound design. Expect curated lighting, food vendors, and late-set afterparties on the patio.",
    date: "2026-08-14T20:00:00",
    location: "East Riverside",
    city: "Austin",
    venue: "Lumen Yard",
    price: "$35",
    image: "/demos/event-horizon/events/aurora.svg",
    gallery: ["/demos/event-horizon/events/aurora.svg", "/demos/event-horizon/events/pulse.svg", "/demos/event-horizon/events/orbit.svg"],
    featured: true,
    attendees: 842,
    organizer: "Signal Collective",
  },
  {
    id: "frontier-dev-summit",
    title: "Frontier Dev Summit",
    category: "Tech",
    description:
      "A one-day summit on product engineering, design systems, and AI workflows.",
    longDescription:
      "Join builders, PMs, and designers for talks, workshops, and hallway tracks focused on shipping polished software. Includes lunch, swag, and evening networking.",
    date: "2026-08-22T09:00:00",
    location: "Downtown",
    city: "Chicago",
    venue: "Harbor Convention Hall",
    price: "$120",
    image: "/demos/event-horizon/events/frontier.svg",
    gallery: ["/demos/event-horizon/events/frontier.svg", "/demos/event-horizon/events/circuit.svg", "/demos/event-horizon/events/orbit.svg"],
    featured: true,
    attendees: 1260,
    organizer: "Build Guild",
  },
  {
    id: "canvas-after-dark",
    title: "Canvas After Dark",
    category: "Arts",
    description:
      "Gallery openings, live muralists, and limited-edition print drops.",
    longDescription:
      "Explore emerging artists across three warehouse rooms. Guided tours run hourly, with a silent auction benefiting local art education programs.",
    date: "2026-08-09T18:30:00",
    location: "Warehouse District",
    city: "Seattle",
    venue: "Frame & Form",
    price: "Free",
    image: "/demos/event-horizon/events/canvas.svg",
    gallery: ["/demos/event-horizon/events/canvas.svg", "/demos/event-horizon/events/pulse.svg", "/demos/event-horizon/events/aurora.svg"],
    featured: true,
    attendees: 510,
    organizer: "Pacific Arts League",
  },
  {
    id: "taste-of-the-grid",
    title: "Taste of the Grid",
    category: "Food",
    description:
      "Chef pop-ups, tasting flights, and a night market under string lights.",
    longDescription:
      "Sample dishes from twelve local kitchens in a walkable night-market format. Vegetarian and allergen-friendly options labeled throughout.",
    date: "2026-08-30T17:00:00",
    location: "RiNo",
    city: "Denver",
    venue: "Grid Market Pavilion",
    price: "$28",
    image: "/demos/event-horizon/events/taste.svg",
    gallery: ["/demos/event-horizon/events/taste.svg", "/demos/event-horizon/events/canvas.svg", "/demos/event-horizon/events/pulse.svg"],
    featured: false,
    attendees: 980,
    organizer: "Culinary Commons",
  },
  {
    id: "harbor-run-classic",
    title: "Harbor Run Classic",
    category: "Sports",
    description:
      "5K and 10K routes along the waterfront with live timing and finish-line festivities.",
    longDescription:
      "Chip-timed races for all levels, plus kids’ fun run and recovery zone. Packet pickup opens the day before at Harbor Pavilion.",
    date: "2026-09-06T07:30:00",
    location: "Waterfront",
    city: "Miami",
    venue: "Pier 12 Start Line",
    price: "$45",
    image: "/demos/event-horizon/events/harbor.svg",
    gallery: ["/demos/event-horizon/events/harbor.svg", "/demos/event-horizon/events/orbit.svg", "/demos/event-horizon/events/circuit.svg"],
    featured: false,
    attendees: 2100,
    organizer: "Coastal Athletics",
  },
  {
    id: "velvet-room-sessions",
    title: "Velvet Room Sessions",
    category: "Nightlife",
    description:
      "Intimate DJ sets, cocktail pairings, and a members-style lounge atmosphere.",
    longDescription:
      "A ticketed lounge night featuring rotating residents and guest selectors. Dress code: elevated casual. 21+ only.",
    date: "2026-08-16T21:00:00",
    location: "Williamsburg",
    city: "Brooklyn",
    venue: "The Velvet Room",
    price: "$40",
    image: "/demos/event-horizon/events/velvet.svg",
    gallery: ["/demos/event-horizon/events/velvet.svg", "/demos/event-horizon/events/aurora.svg", "/demos/event-horizon/events/pulse.svg"],
    featured: true,
    attendees: 220,
    organizer: "Night Atlas",
  },
  {
    id: "circuit-makers-lab",
    title: "Circuit Makers Lab",
    category: "Tech",
    description:
      "Hands-on hardware prototyping workshop for beginners and tinkerers.",
    longDescription:
      "Build a simple IoT sensor kit with mentors on-site. All materials included; bring a laptop if you have one.",
    date: "2026-09-12T13:00:00",
    location: "North Loop",
    city: "Austin",
    venue: "Maker Annex",
    price: "$65",
    image: "/demos/event-horizon/events/circuit.svg",
    gallery: ["/demos/event-horizon/events/circuit.svg", "/demos/event-horizon/events/frontier.svg", "/demos/event-horizon/events/orbit.svg"],
    featured: false,
    attendees: 96,
    organizer: "Hardware Hive",
  },
  {
    id: "pulse-film-garden",
    title: "Pulse Film Garden",
    category: "Arts",
    description:
      "Outdoor short-film screenings with director Q&As and picnic seating.",
    longDescription:
      "A curated set of independent shorts under the stars. Blankets welcome; concessions open at dusk.",
    date: "2026-08-28T19:30:00",
    location: "Capitol Hill",
    city: "Seattle",
    venue: "Cedar Lawn Amphitheater",
    price: "$18",
    image: "/demos/event-horizon/events/pulse.svg",
    gallery: ["/demos/event-horizon/events/pulse.svg", "/demos/event-horizon/events/canvas.svg", "/demos/event-horizon/events/velvet.svg"],
    featured: false,
    attendees: 430,
    organizer: "Indie Frame",
  },
  {
    id: "orbit-community-cup",
    title: "Orbit Community Cup",
    category: "Sports",
    description:
      "Friendly neighborhood soccer tournament with food trucks and live DJ.",
    longDescription:
      "Register as a team or join the free-agent pool. Brackets posted Friday; finals Sunday afternoon.",
    date: "2026-09-20T10:00:00",
    location: "Logan Square",
    city: "Chicago",
    venue: "Orbit Fields",
    price: "$20",
    image: "/demos/event-horizon/events/orbit.svg",
    gallery: ["/demos/event-horizon/events/orbit.svg", "/demos/event-horizon/events/harbor.svg", "/demos/event-horizon/events/taste.svg"],
    featured: false,
    attendees: 640,
    organizer: "City League Network",
  },
];

export function getEventById(id: string) {
  return events.find((event) => event.id === id);
}

export function getFeaturedEvents() {
  return events.filter((event) => event.featured);
}

export type SortOption = "date-asc" | "date-desc" | "popular" | "title";

export type EventFilters = {
  query: string;
  category: EventCategory | "All";
  city: string;
  date: string;
  sort: SortOption;
};

export function filterEvents(
  list: EventItem[],
  filters: EventFilters,
): EventItem[] {
  let result = [...list];

  const q = filters.query.trim().toLowerCase();
  if (q) {
    result = result.filter((event) =>
      [
        event.title,
        event.description,
        event.category,
        event.city,
        event.venue,
        event.location,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  if (filters.category !== "All") {
    result = result.filter((event) => event.category === filters.category);
  }

  if (filters.city && filters.city !== "All") {
    result = result.filter((event) => event.city === filters.city);
  }

  if (filters.date) {
    result = result.filter((event) => event.date.slice(0, 10) >= filters.date);
  }

  switch (filters.sort) {
    case "date-desc":
      result.sort((a, b) => +new Date(b.date) - +new Date(a.date));
      break;
    case "popular":
      result.sort((a, b) => b.attendees - a.attendees);
      break;
    case "title":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "date-asc":
    default:
      result.sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }

  return result;
}
