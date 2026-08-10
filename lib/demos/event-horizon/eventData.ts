import {
  resolveEventCoverImage,
  resolveEventGallery,
} from "@/lib/demos/event-horizon/placeholders";

/**
 * Event Horizon catalog module.
 *
 * AUTHORITATIVE RUNTIME DATA lives in PostgreSQL (seeded from this file).
 * Keep this module as:
 * - seed input for `prisma/seed.ts`
 * - SSG / offline fallback when DATABASE_URL is unavailable
 * Do not maintain a second independent production catalog.
 */
export type EventCategory =
  | "Music"
  | "Tech"
  | "Arts"
  | "Food"
  | "Sports"
  | "Nightlife";

export type EventStatus = "upcoming" | "sold-out" | "cancelled" | "postponed";

export type TicketAvailability = "available" | "limited" | "sold-out";

export interface TicketType {
  id: string;
  name: string;
  /** Unit price in USD. */
  price: number;
  quantityRemaining: number;
  purchaseLimit: number;
  description: string;
  availability: TicketAvailability;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: EventCategory;
  venue: string;
  city: string;
  state: string;
  country: string;
  address: string;
  timezone: string;
  startDateTime: string;
  endDateTime: string;
  image: string;
  /** Extra images for the detail gallery. */
  gallery: string[];
  featured: boolean;
  tags: string[];
  capacity: number;
  status: EventStatus;
  organizer: string;
  ticketTypes: TicketType[];
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

const IMG = "/demos/event-horizon/events";

function tickets(
  ...items: TicketType[]
): TicketType[] {
  return items;
}

const CATALOG_EVENTS: EventItem[] = [
  {
    id: "aurora-synth-night",
    slug: "aurora-synth-night",
    title: "Aurora Synth Night",
    shortDescription:
      "Live synthwave under amber light—open-air lounges, late sets, and a night that pulls you in.",
    description:
      "Aurora Synth Night gathers rising electronic artists for analog warmth and futuristic sound design. Curated lighting, chef vendors, and patio afterparties turn the yard into a private venue for the evening.",
    category: "Music",
    venue: "Lumen Yard",
    city: "Austin",
    state: "TX",
    country: "US",
    address: "2101 E Riverside Dr, Austin, TX 78741",
    timezone: "America/Chicago",
    startDateTime: "2026-08-14T20:00:00-05:00",
    endDateTime: "2026-08-15T01:00:00-05:00",
    image: `${IMG}/aurora.svg`,
    gallery: [`${IMG}/aurora.svg`, `${IMG}/pulse.svg`, `${IMG}/orbit.svg`],
    featured: true,
    tags: ["electronic", "outdoor", "nightlife"],
    capacity: 900,
    status: "upcoming",
    organizer: "Signal Collective",
    ticketTypes: tickets(
      {
        id: "aurora-ga",
        name: "General Admission",
        price: 35,
        quantityRemaining: 240,
        purchaseLimit: 6,
        description: "Standing room and courtyard access.",
        availability: "available",
      },
      {
        id: "aurora-vip",
        name: "VIP",
        price: 85,
        quantityRemaining: 40,
        purchaseLimit: 4,
        description: "Lounge seating, welcome drink, and priority entry.",
        availability: "limited",
      },
    ),
  },
  {
    id: "frontier-dev-summit",
    slug: "frontier-dev-summit",
    title: "Tech Foundry Summit",
    shortDescription:
      "A focused day for builders—product craft, design systems, and AI workflows that actually ship.",
    description:
      "Tech Foundry Summit convenes engineers, PMs, and designers for sharp talks, hands-on workshops, and hallway conversations about shipping polished software. Lunch, swag, and an evening mixer included.",
    category: "Tech",
    venue: "Harbor Convention Hall",
    city: "Chicago",
    state: "IL",
    country: "US",
    address: "2301 S Lake Shore Dr, Chicago, IL 60616",
    timezone: "America/Chicago",
    startDateTime: "2026-08-22T09:00:00-05:00",
    endDateTime: "2026-08-22T18:00:00-05:00",
    image: `${IMG}/frontier.svg`,
    gallery: [`${IMG}/frontier.svg`, `${IMG}/circuit.svg`, `${IMG}/orbit.svg`],
    featured: true,
    tags: ["conference", "engineering", "design", "editors-pick"],
    capacity: 1400,
    status: "upcoming",
    organizer: "Build Guild",
    ticketTypes: tickets(
      {
        id: "frontier-early",
        name: "Early Bird",
        price: 95,
        quantityRemaining: 12,
        purchaseLimit: 2,
        description: "Discounted full-day pass while supplies last.",
        availability: "limited",
      },
      {
        id: "frontier-ga",
        name: "General Admission",
        price: 120,
        quantityRemaining: 420,
        purchaseLimit: 5,
        description: "Talks, workshops, lunch, and evening mixer.",
        availability: "available",
      },
      {
        id: "frontier-student",
        name: "Student",
        price: 45,
        quantityRemaining: 80,
        purchaseLimit: 1,
        description: "Valid student ID required at check-in.",
        availability: "available",
      },
    ),
  },
  {
    id: "canvas-after-dark",
    slug: "canvas-after-dark",
    title: "Lunar Art Walk",
    shortDescription:
      "Gallery openings, live muralists, and limited-edition prints after dark.",
    description:
      "Wander three warehouse rooms of emerging artists under low light. Hourly guided tours and a silent auction support local art education—an evening made for lingering.",
    category: "Arts",
    venue: "Frame & Form",
    city: "Seattle",
    state: "WA",
    country: "US",
    address: "88 S Holgate St, Seattle, WA 98134",
    timezone: "America/Los_Angeles",
    startDateTime: "2026-08-09T18:30:00-07:00",
    endDateTime: "2026-08-09T22:30:00-07:00",
    image: `${IMG}/canvas.svg`,
    gallery: [`${IMG}/canvas.svg`, `${IMG}/pulse.svg`, `${IMG}/aurora.svg`],
    featured: true,
    tags: ["gallery", "community", "exclusive"],
    capacity: 550,
    status: "upcoming",
    organizer: "Pacific Arts League",
    ticketTypes: tickets(
      {
        id: "canvas-free",
        name: "General Admission",
        price: 0,
        quantityRemaining: 300,
        purchaseLimit: 4,
        description: "Free entry · RSVP required for capacity planning.",
        availability: "available",
      },
    ),
  },
  {
    id: "taste-of-the-grid",
    slug: "taste-of-the-grid",
    title: "Midnight Food Festival",
    shortDescription:
      "Chef pop-ups, tasting flights, and a night market under string lights.",
    description:
      "Twelve local kitchens line a walkable night market. Vegetarian and allergen-friendly options are clearly marked; VIP seats the chef table with unlimited tasting tokens.",
    category: "Food",
    venue: "Grid Market Pavilion",
    city: "Denver",
    state: "CO",
    country: "US",
    address: "3501 Wazee St, Denver, CO 80216",
    timezone: "America/Denver",
    startDateTime: "2026-08-30T17:00:00-06:00",
    endDateTime: "2026-08-30T22:00:00-06:00",
    image: `${IMG}/taste.svg`,
    gallery: [`${IMG}/taste.svg`, `${IMG}/canvas.svg`, `${IMG}/pulse.svg`],
    featured: false,
    tags: ["food", "market", "family-friendly"],
    capacity: 1100,
    status: "upcoming",
    organizer: "Culinary Commons",
    ticketTypes: tickets(
      {
        id: "taste-ga",
        name: "General Admission",
        price: 28,
        quantityRemaining: 510,
        purchaseLimit: 8,
        description: "Entry plus four tasting tokens.",
        availability: "available",
      },
      {
        id: "taste-vip",
        name: "VIP",
        price: 68,
        quantityRemaining: 60,
        purchaseLimit: 4,
        description: "Chef table seating and unlimited tasting tokens.",
        availability: "available",
      },
    ),
  },
  {
    id: "harbor-run-classic",
    slug: "harbor-run-classic",
    title: "Harbor Lights Festival",
    shortDescription:
      "Waterfront music, lantern markets, and finish-line energy as the skyline lights up.",
    description:
      "Harbor Lights Festival blends chip-timed morning races with an evening lantern market, live sets, and skyline views. Packet pickup opens the day before at Harbor Pavilion; medals wait at the finish.",
    category: "Sports",
    venue: "Pier 12 Start Line",
    city: "Miami",
    state: "FL",
    country: "US",
    address: "100 Chopin Plaza, Miami, FL 33131",
    timezone: "America/New_York",
    startDateTime: "2026-09-06T07:30:00-04:00",
    endDateTime: "2026-09-06T12:00:00-04:00",
    image: `${IMG}/harbor.svg`,
    gallery: [`${IMG}/harbor.svg`, `${IMG}/orbit.svg`, `${IMG}/circuit.svg`],
    featured: false,
    tags: ["running", "charity", "outdoors"],
    capacity: 2200,
    status: "upcoming",
    organizer: "Coastal Athletics",
    ticketTypes: tickets(
      {
        id: "harbor-5k",
        name: "General Admission",
        price: 45,
        quantityRemaining: 860,
        purchaseLimit: 4,
        description: "5K or 10K entry with finisher medal.",
        availability: "available",
      },
      {
        id: "harbor-student",
        name: "Student",
        price: 30,
        quantityRemaining: 120,
        purchaseLimit: 1,
        description: "Student rate for 5K only.",
        availability: "available",
      },
    ),
  },
  {
    id: "velvet-room-sessions",
    slug: "velvet-room-sessions",
    title: "Skyline Jazz Sessions",
    shortDescription:
      "Intimate sets, cocktail pairings, and a members-style lounge above the city.",
    description:
      "Rotating residents and guest selectors in a ticketed lounge. Dress code: elevated casual. 21+ only—booth VIP includes bottle service menu.",
    category: "Nightlife",
    venue: "The Velvet Room",
    city: "Brooklyn",
    state: "NY",
    country: "US",
    address: "180 N 10th St, Brooklyn, NY 11211",
    timezone: "America/New_York",
    startDateTime: "2026-08-16T21:00:00-04:00",
    endDateTime: "2026-08-17T02:00:00-04:00",
    image: `${IMG}/velvet.svg`,
    gallery: [`${IMG}/velvet.svg`, `${IMG}/aurora.svg`, `${IMG}/pulse.svg`],
    featured: true,
    tags: ["lounge", "21+", "dj", "vip", "exclusive"],
    capacity: 220,
    status: "sold-out",
    organizer: "Night Atlas",
    ticketTypes: tickets(
      {
        id: "velvet-ga",
        name: "General Admission",
        price: 40,
        quantityRemaining: 0,
        purchaseLimit: 4,
        description: "Lounge floor access · currently sold out.",
        availability: "sold-out",
      },
      {
        id: "velvet-vip",
        name: "VIP",
        price: 95,
        quantityRemaining: 0,
        purchaseLimit: 2,
        description: "Booth seating and bottle service menu.",
        availability: "sold-out",
      },
    ),
  },
  {
    id: "circuit-makers-lab",
    slug: "circuit-makers-lab",
    title: "Circuit Makers Lab",
    shortDescription:
      "Hands-on hardware prototyping—build a sensor kit with mentors at your shoulder.",
    description:
      "Assemble a simple IoT kit with on-site mentors. Materials included; bring a laptop if you have one. Limited seats keep the room intimate.",
    category: "Tech",
    venue: "Maker Annex",
    city: "Austin",
    state: "TX",
    country: "US",
    address: "916 Springdale Rd, Austin, TX 78702",
    timezone: "America/Chicago",
    startDateTime: "2026-09-12T13:00:00-05:00",
    endDateTime: "2026-09-12T17:00:00-05:00",
    image: `${IMG}/circuit.svg`,
    gallery: [`${IMG}/circuit.svg`, `${IMG}/frontier.svg`, `${IMG}/orbit.svg`],
    featured: false,
    tags: ["workshop", "hardware", "hands-on"],
    capacity: 100,
    status: "upcoming",
    organizer: "Hardware Hive",
    ticketTypes: tickets(
      {
        id: "circuit-ga",
        name: "General Admission",
        price: 65,
        quantityRemaining: 28,
        purchaseLimit: 2,
        description: "Seat, kit, and mentor support.",
        availability: "limited",
      },
      {
        id: "circuit-student",
        name: "Student",
        price: 40,
        quantityRemaining: 15,
        purchaseLimit: 1,
        description: "Discounted workshop seat for students.",
        availability: "available",
      },
    ),
  },
  {
    id: "pulse-film-garden",
    slug: "pulse-film-garden",
    title: "Neon Rooftop Cinema",
    shortDescription:
      "Independent shorts under the stars—director Q&As and picnic seating at dusk.",
    description:
      "A curated reel of indie shorts with directors in conversation. Blankets welcome; concessions open at dusk. Early-bird lawn seats go fast.",
    category: "Arts",
    venue: "Cedar Lawn Amphitheater",
    city: "Seattle",
    state: "WA",
    country: "US",
    address: "1400 E Pine St, Seattle, WA 98122",
    timezone: "America/Los_Angeles",
    startDateTime: "2026-08-28T19:30:00-07:00",
    endDateTime: "2026-08-28T22:30:00-07:00",
    image: `${IMG}/pulse.svg`,
    gallery: [`${IMG}/pulse.svg`, `${IMG}/canvas.svg`, `${IMG}/velvet.svg`],
    featured: false,
    tags: ["film", "outdoor", "q&a"],
    capacity: 450,
    status: "upcoming",
    organizer: "Indie Frame",
    ticketTypes: tickets(
      {
        id: "pulse-early",
        name: "Early Bird",
        price: 14,
        quantityRemaining: 8,
        purchaseLimit: 4,
        description: "Discounted lawn seating.",
        availability: "limited",
      },
      {
        id: "pulse-ga",
        name: "General Admission",
        price: 18,
        quantityRemaining: 210,
        purchaseLimit: 6,
        description: "Lawn seating · bring a blanket.",
        availability: "available",
      },
    ),
  },
  {
    id: "orbit-community-cup",
    slug: "orbit-community-cup",
    title: "Orbit Community Cup",
    shortDescription:
      "Neighborhood soccer brackets with food trucks and a live DJ through finals.",
    description:
      "Register as a team or join the free-agent pool. Brackets post Friday; finals Sunday afternoon under hospitality tents and sideline VIP seating.",
    category: "Sports",
    venue: "Orbit Fields",
    city: "Chicago",
    state: "IL",
    country: "US",
    address: "2230 N Central Park Ave, Chicago, IL 60647",
    timezone: "America/Chicago",
    startDateTime: "2026-09-20T10:00:00-05:00",
    endDateTime: "2026-09-20T18:00:00-05:00",
    image: `${IMG}/orbit.svg`,
    gallery: [`${IMG}/orbit.svg`, `${IMG}/harbor.svg`, `${IMG}/taste.svg`],
    featured: false,
    tags: ["soccer", "community", "weekend"],
    capacity: 700,
    status: "upcoming",
    organizer: "City League Network",
    ticketTypes: tickets(
      {
        id: "orbit-ga",
        name: "General Admission",
        price: 20,
        quantityRemaining: 340,
        purchaseLimit: 8,
        description: "Spectator weekend pass.",
        availability: "available",
      },
      {
        id: "orbit-vip",
        name: "VIP",
        price: 55,
        quantityRemaining: 45,
        purchaseLimit: 4,
        description: "Sideline seating and hospitality tent.",
        availability: "available",
      },
    ),
  },
  {
    id: "neon-lane-sessions",
    slug: "neon-lane-sessions",
    title: "Neon Lane Sessions",
    shortDescription:
      "Tonight-only DJ runway through neon alleyways — doors early, bass late.",
    description:
      "A pop-up alley concert with rotating selectors, projection mapping, and a short walk between stages. 21+ after 10pm; wristbands at entry.",
    category: "Music",
    venue: "Neon Lane",
    city: "Austin",
    state: "TX",
    country: "US",
    address: "1200 E 6th St, Austin, TX 78702",
    timezone: "America/Chicago",
    startDateTime: "2026-08-04T20:00:00-05:00",
    endDateTime: "2026-08-05T01:00:00-05:00",
    image: `${IMG}/aurora.svg`,
    gallery: [`${IMG}/aurora.svg`, `${IMG}/velvet.svg`, `${IMG}/pulse.svg`],
    featured: false,
    tags: ["electronic", "nightlife", "outdoor"],
    capacity: 600,
    status: "upcoming",
    organizer: "Lane Collective",
    ticketTypes: tickets(
      {
        id: "neon-ga",
        name: "General Admission",
        price: 22,
        quantityRemaining: 90,
        purchaseLimit: 6,
        description: "Alley access and stage areas.",
        availability: "limited",
      },
      {
        id: "neon-vip",
        name: "VIP",
        price: 55,
        quantityRemaining: 18,
        purchaseLimit: 4,
        description: "Rooftop overlook and welcome drink.",
        availability: "limited",
      },
    ),
  },
  {
    id: "foundry-after-hours",
    slug: "foundry-after-hours",
    title: "Foundry After Hours",
    shortDescription:
      "Builder mixer tonight — demos, soft lighting, and conversations that stick.",
    description:
      "An evening extension of Tech Foundry energy: lightning demos, mentor tables, and a quiet bar for follow-ups. Badge optional; curiosity required.",
    category: "Tech",
    venue: "Harbor Annex Lounge",
    city: "Chicago",
    state: "IL",
    country: "US",
    address: "2301 S Lake Shore Dr, Chicago, IL 60616",
    timezone: "America/Chicago",
    startDateTime: "2026-08-04T18:30:00-05:00",
    endDateTime: "2026-08-04T22:00:00-05:00",
    image: `${IMG}/frontier.svg`,
    gallery: [`${IMG}/frontier.svg`, `${IMG}/circuit.svg`],
    featured: false,
    tags: ["networking", "engineering"],
    capacity: 280,
    status: "upcoming",
    organizer: "Build Guild",
    ticketTypes: tickets(
      {
        id: "foundry-ah-ga",
        name: "General Admission",
        price: 15,
        quantityRemaining: 64,
        purchaseLimit: 2,
        description: "Lounge access and demo floor.",
        availability: "limited",
      },
    ),
  },
  {
    id: "amber-room-comedy",
    slug: "amber-room-comedy",
    title: "Amber Room Comedy",
    shortDescription:
      "Low-lit stand-up in a members-style room — sharp sets, warm cocktails.",
    description:
      "Rotating comics in an intimate amber room. Two-drink minimum; early seating recommended. Perfect for a weeknight escape.",
    category: "Nightlife",
    venue: "Amber Room",
    city: "Brooklyn",
    state: "NY",
    country: "US",
    address: "88 Berry St, Brooklyn, NY 11249",
    timezone: "America/New_York",
    startDateTime: "2026-08-07T20:00:00-04:00",
    endDateTime: "2026-08-07T22:30:00-04:00",
    image: `${IMG}/velvet.svg`,
    gallery: [`${IMG}/velvet.svg`, `${IMG}/canvas.svg`],
    featured: false,
    tags: ["comedy", "21+", "lounge"],
    capacity: 140,
    status: "upcoming",
    organizer: "Night Atlas",
    ticketTypes: tickets(
      {
        id: "amber-ga",
        name: "General Admission",
        price: 28,
        quantityRemaining: 42,
        purchaseLimit: 4,
        description: "Reserved seating in the amber room.",
        availability: "available",
      },
    ),
  },
  {
    id: "skyline-rooftop-market",
    slug: "skyline-rooftop-market",
    title: "Skyline Rooftop Market",
    shortDescription:
      "Sunset tasting market above the city — chefs, wine, and skyline glow.",
    description:
      "A walkable rooftop market with chef stations, natural wine, and string lights as the skyline turns gold. Vegetarian options marked throughout.",
    category: "Food",
    venue: "Pierce Rooftop",
    city: "Chicago",
    state: "IL",
    country: "US",
    address: "300 N State St, Chicago, IL 60654",
    timezone: "America/Chicago",
    startDateTime: "2026-08-08T17:00:00-05:00",
    endDateTime: "2026-08-08T22:00:00-05:00",
    image: `${IMG}/taste.svg`,
    gallery: [`${IMG}/taste.svg`, `${IMG}/harbor.svg`],
    featured: true,
    tags: ["food", "market", "exclusive"],
    capacity: 480,
    status: "upcoming",
    organizer: "Culinary Commons",
    ticketTypes: tickets(
      {
        id: "skyline-ga",
        name: "General Admission",
        price: 32,
        quantityRemaining: 120,
        purchaseLimit: 6,
        description: "Entry plus three tasting tokens.",
        availability: "available",
      },
      {
        id: "skyline-vip",
        name: "VIP",
        price: 75,
        quantityRemaining: 28,
        purchaseLimit: 4,
        description: "Chef table and unlimited tokens.",
        availability: "limited",
      },
    ),
  },
  {
    id: "cedar-chamber-night",
    slug: "cedar-chamber-night",
    title: "Cedar Chamber Night",
    shortDescription:
      "Acoustic chamber set in a wood-lined hall — intimate, unamplified, unforgettable.",
    description:
      "A small-ensemble evening with warm wood acoustics and a short mingling hour after the final movement. Limited seating by design.",
    category: "Arts",
    venue: "Cedar Hall",
    city: "Seattle",
    state: "WA",
    country: "US",
    address: "901 12th Ave, Seattle, WA 98122",
    timezone: "America/Los_Angeles",
    startDateTime: "2026-08-10T19:00:00-07:00",
    endDateTime: "2026-08-10T21:00:00-07:00",
    image: `${IMG}/canvas.svg`,
    gallery: [`${IMG}/canvas.svg`, `${IMG}/pulse.svg`],
    featured: false,
    tags: ["music", "intimate", "editors-pick"],
    capacity: 160,
    status: "upcoming",
    organizer: "Pacific Arts League",
    ticketTypes: tickets(
      {
        id: "cedar-ga",
        name: "General Admission",
        price: 36,
        quantityRemaining: 22,
        purchaseLimit: 4,
        description: "Reserved chamber seating.",
        availability: "limited",
      },
    ),
  },
  {
    id: "lumen-yoga-dawn",
    slug: "lumen-yoga-dawn",
    title: "Lumen Dawn Flow",
    shortDescription:
      "Sunrise rooftop yoga with live ambient score — calm before the city wakes.",
    description:
      "A guided dawn flow on the Lumen Yard roof with ambient musicians and tea service after savasana. Mats available; bring layers.",
    category: "Sports",
    venue: "Lumen Yard Roof",
    city: "Austin",
    state: "TX",
    country: "US",
    address: "2101 E Riverside Dr, Austin, TX 78741",
    timezone: "America/Chicago",
    startDateTime: "2026-08-09T06:30:00-05:00",
    endDateTime: "2026-08-09T08:00:00-05:00",
    image: `${IMG}/orbit.svg`,
    gallery: [`${IMG}/orbit.svg`, `${IMG}/aurora.svg`],
    featured: false,
    tags: ["fitness", "outdoor", "family-friendly"],
    capacity: 90,
    status: "upcoming",
    organizer: "Signal Collective",
    ticketTypes: tickets(
      {
        id: "lumen-yoga-ga",
        name: "General Admission",
        price: 18,
        quantityRemaining: 35,
        purchaseLimit: 2,
        description: "Rooftop class and tea service.",
        availability: "available",
      },
    ),
  },
  {
    id: "harbor-lights-festival",
    slug: "harbor-lights-festival",
    title: "Harbor Evening Lights",
    shortDescription:
      "Lantern walk, waterfront sets, and late dessert stalls as the harbor glows.",
    description:
      "An evening-only companion to the classic — lantern paths, acoustic sets, and dessert stalls along the pier. Family welcome until 9pm.",
    category: "Arts",
    venue: "Pier 12 Promenade",
    city: "Miami",
    state: "FL",
    country: "US",
    address: "100 Chopin Plaza, Miami, FL 33131",
    timezone: "America/New_York",
    startDateTime: "2026-08-06T18:00:00-04:00",
    endDateTime: "2026-08-06T23:00:00-04:00",
    image: `${IMG}/harbor.svg`,
    gallery: [`${IMG}/harbor.svg`, `${IMG}/taste.svg`, `${IMG}/pulse.svg`],
    featured: true,
    tags: ["festival", "family-friendly", "outdoor"],
    capacity: 1600,
    status: "upcoming",
    organizer: "Coastal Athletics",
    ticketTypes: tickets(
      {
        id: "harbor-evening-ga",
        name: "General Admission",
        price: 12,
        quantityRemaining: 520,
        purchaseLimit: 8,
        description: "Promenade access and lantern walk.",
        availability: "available",
      },
      {
        id: "harbor-evening-free",
        name: "Community Pass",
        price: 0,
        quantityRemaining: 200,
        purchaseLimit: 4,
        description: "Free twilight entry · RSVP required.",
        availability: "available",
      },
    ),
  },
];

/** Apply premium artwork to every catalog event (generated → category fallback). */
function withCategoryPlaceholders(event: EventItem): EventItem {
  return {
    ...event,
    image: resolveEventCoverImage(event),
    gallery: resolveEventGallery(event),
  };
}

export const events: EventItem[] = CATALOG_EVENTS.map(withCategoryPlaceholders);


export function getEventById(id: string) {
  return events.find((event) => event.id === id || event.slug === id);
}

export function getFeaturedEvents() {
  return events.filter((event) => event.featured);
}

export function getTicketById(event: EventItem, ticketId: string) {
  return event.ticketTypes.find((ticket) => ticket.id === ticketId);
}

/** Lowest available ticket price for display; null when nothing is for sale. */
export function getLowestTicketPrice(event: EventItem): number | null {
  const available = event.ticketTypes.filter(
    (ticket) =>
      ticket.availability !== "sold-out" && ticket.quantityRemaining > 0,
  );
  if (!available.length) return null;
  return Math.min(...available.map((ticket) => ticket.price));
}

export function formatTicketPrice(price: number): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

export function getEventPriceLabel(event: EventItem): string {
  if (event.status === "sold-out") return "Sold out";
  if (event.status === "cancelled") return "Cancelled";
  if (event.status === "postponed") return "Postponed";
  const lowest = getLowestTicketPrice(event);
  if (lowest === null) return "Sold out";
  if (lowest === 0) return "Free";
  return `From ${formatTicketPrice(lowest)}`;
}

export function getInterestScore(event: EventItem): number {
  const remaining = event.ticketTypes.reduce(
    (sum, ticket) => sum + ticket.quantityRemaining,
    0,
  );
  return Math.max(event.capacity - remaining, 0);
}

export type SortOption = "date-asc" | "date-desc" | "popular" | "title";

export type EventFilters = {
  query: string;
  category: EventCategory | "All";
  city: string;
  date: string;
  sort: SortOption;
  /** When true, only featured events. When false/undefined, no featured constraint. */
  featured: boolean;
};

export const DEFAULT_EVENT_FILTERS: EventFilters = {
  query: "",
  category: "All",
  city: "All",
  date: "",
  sort: "date-asc",
  featured: false,
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
        event.shortDescription,
        event.description,
        event.category,
        event.city,
        event.venue,
        event.address,
        ...event.tags,
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
    result = result.filter(
      (event) => event.startDateTime.slice(0, 10) >= filters.date,
    );
  }

  if (filters.featured) {
    result = result.filter((event) => event.featured);
  }

  switch (filters.sort) {
    case "date-desc":
      result.sort(
        (a, b) => +new Date(b.startDateTime) - +new Date(a.startDateTime),
      );
      break;
    case "popular":
      result.sort((a, b) => getInterestScore(b) - getInterestScore(a));
      break;
    case "title":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "date-asc":
    default:
      result.sort(
        (a, b) => +new Date(a.startDateTime) - +new Date(b.startDateTime),
      );
  }

  return result;
}
