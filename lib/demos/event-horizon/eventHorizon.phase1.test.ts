import { describe, expect, it } from "vitest";
import {
  DEFAULT_EVENT_FILTERS,
  events,
  filterEvents,
  getEventById,
  getTicketById,
} from "./eventData";
import {
  buildBrowseHref,
  parseEventFilters,
  serializeEventFilters,
} from "./filters";
import {
  calculateReservationTotals,
  createConfirmationNumber,
  isConfirmationNumber,
  validateReservation,
} from "./reservation";

describe("event filter URL sync", () => {
  it("parses browse search parameters into filters", () => {
    const params = new URLSearchParams(
      "q=music&category=Music&city=Austin&date=2026-08-01&sort=popular&featured=true",
    );
    expect(parseEventFilters(params)).toEqual({
      query: "music",
      category: "Music",
      city: "Austin",
      date: "2026-08-01",
      sort: "popular",
      featured: true,
    });
  });

  it("falls back safely for invalid parameter values", () => {
    const params = new URLSearchParams(
      "category=Nope&city=Paris&sort=random&date=08-01-2026&featured=maybe",
    );
    expect(parseEventFilters(params)).toEqual(DEFAULT_EVENT_FILTERS);
  });

  it("serializes only non-default filters", () => {
    expect(serializeEventFilters(DEFAULT_EVENT_FILTERS)).toBe("");
    expect(
      serializeEventFilters({
        ...DEFAULT_EVENT_FILTERS,
        query: " synth ",
        category: "Music",
        city: "Austin",
        featured: true,
        sort: "popular",
      }),
    ).toBe("q=synth&category=Music&city=Austin&sort=popular&featured=true");
  });

  it("builds browse hrefs without clutter for defaults", () => {
    expect(buildBrowseHref(DEFAULT_EVENT_FILTERS)).toBe(
      "/demos/event-horizon/browse",
    );
    expect(
      buildBrowseHref({
        ...DEFAULT_EVENT_FILTERS,
        query: "music",
      }),
    ).toBe("/demos/event-horizon/browse?q=music");
  });
});

describe("event filtering and sorting", () => {
  it("filters by query, category, city, date, and featured", () => {
    const result = filterEvents(events, {
      query: "synth",
      category: "Music",
      city: "Austin",
      date: "2026-08-01",
      sort: "date-asc",
      featured: true,
    });
    expect(result.map((event) => event.id)).toEqual(["aurora-synth-night"]);
  });

  it("sorts by popularity using reserved interest", () => {
    const result = filterEvents(events, {
      ...DEFAULT_EVENT_FILTERS,
      sort: "popular",
    });
    expect(result[0]?.id).toBeTruthy();
    for (let i = 1; i < result.length; i += 1) {
      const prev = result[i - 1]!;
      const curr = result[i]!;
      const prevScore = prev.capacity -
        prev.ticketTypes.reduce((sum, t) => sum + t.quantityRemaining, 0);
      const currScore = curr.capacity -
        curr.ticketTypes.reduce((sum, t) => sum + t.quantityRemaining, 0);
      expect(prevScore).toBeGreaterThanOrEqual(currScore);
    }
  });
});

describe("reservation calculations", () => {
  it("computes subtotal, fees, and total", () => {
    const totals = calculateReservationTotals(35, 2);
    expect(totals.subtotal).toBe(70);
    expect(totals.fees).toBe(8.1);
    expect(totals.total).toBe(78.1);
  });

  it("returns zero fees for invalid quantity", () => {
    expect(calculateReservationTotals(40, 0)).toEqual({
      unitPrice: 40,
      quantity: 0,
      subtotal: 0,
      fees: 0,
      total: 0,
    });
  });
});

describe("reservation validation", () => {
  it("rejects sold-out events", () => {
    const event = getEventById("velvet-room-sessions");
    expect(event).toBeDefined();
    const result = validateReservation(event!, event!.ticketTypes[0]!.id, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/sold out/i);
    }
  });

  it("rejects quantities below 1 and above purchase limits", () => {
    const event = getEventById("aurora-synth-night")!;
    const ticket = getTicketById(event, "aurora-ga")!;
    expect(validateReservation(event, ticket.id, 0).ok).toBe(false);
    expect(
      validateReservation(event, ticket.id, ticket.purchaseLimit + 1).ok,
    ).toBe(false);
  });

  it("rejects quantities above remaining inventory", () => {
    const event = getEventById("frontier-dev-summit")!;
    const early = getTicketById(event, "frontier-early")!;
    expect(
      validateReservation(event, early.id, early.quantityRemaining + 1).ok,
    ).toBe(false);
  });

  it("accepts a valid reservation", () => {
    const event = getEventById("aurora-synth-night")!;
    const result = validateReservation(event, "aurora-ga", 2);
    expect(result.ok).toBe(true);
  });
});

describe("confirmation numbers", () => {
  it("creates EH-XXXX-XXXX codes", () => {
    const code = createConfirmationNumber("aurora-synth-night");
    expect(isConfirmationNumber(code)).toBe(true);
    expect(code.startsWith("EH-")).toBe(true);
  });
});
