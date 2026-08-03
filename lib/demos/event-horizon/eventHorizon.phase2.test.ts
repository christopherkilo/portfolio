import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  EVENT_DETAIL_LOADING_LABEL,
  EVENT_GRID_LOADING_LABEL,
  EventGridSkeleton,
} from "@/components/demos/event-horizon/ui/Skeleton";
import { events } from "./eventData";
import {
  loadFavoritesFromStorage,
  sanitizeFavoriteIds,
} from "./favoritesStorage";
import {
  addReservation,
  cancelReservation,
  createReservationRecord,
  deleteReservation,
  getReservationDisplayStatus,
  loadReservationsFromStorage,
  sanitizeReservationList,
  type ReservationRecord,
} from "./reservationRecords";
import { createConfirmationNumber } from "./reservation";
import { isEventNotFoundRoute, resolveEventRoute } from "./routes";
import { safeParseJson } from "./storage";
import { getTrendingEvents, getTrendingScore } from "./trending";

function sampleReservation(
  overrides: Partial<ReservationRecord> = {},
): ReservationRecord {
  const event = events[0];
  const ticket = event.ticketTypes[0];
  const base = createReservationRecord({
    confirmationNumber: createConfirmationNumber("testseedaaaa"),
    event,
    ticket,
    quantity: 2,
    reservedAt: "2026-07-20T12:00:00.000Z",
  });
  return { ...base, ...overrides };
}

describe("storage corruption handling", () => {
  it("returns null for corrupted JSON", () => {
    expect(safeParseJson("{not-json")).toBeNull();
    expect(safeParseJson('{"ok":true}')).toEqual({ ok: true });
  });

  it("loads an empty reservation list from corrupted storage", () => {
    expect(loadReservationsFromStorage("{broken")).toEqual([]);
    expect(loadReservationsFromStorage("null")).toEqual([]);
    expect(loadReservationsFromStorage('"string"')).toEqual([]);
  });

  it("loads an empty favorites list from corrupted storage", () => {
    expect(loadFavoritesFromStorage("{broken")).toEqual([]);
    expect(loadFavoritesFromStorage("123")).toEqual([]);
  });
});

describe("reservation persistence helpers", () => {
  it("creates a snapshot reservation record", () => {
    const reservation = sampleReservation();
    expect(reservation.eventId).toBe(events[0].id);
    expect(reservation.ticketType).toBe(events[0].ticketTypes[0].name);
    expect(reservation.quantity).toBe(2);
    expect(reservation.status).toBe("Upcoming");
    expect(reservation.total).toBeGreaterThan(reservation.subtotal);
  });

  it("deduplicates confirmation numbers and drops invalid structures", () => {
    const first = sampleReservation({
      confirmationNumber: "EH-AAAA-BBBB",
    });
    const duplicate = sampleReservation({
      confirmationNumber: "EH-AAAA-BBBB",
      quantity: 9,
    });
    const invalid = { confirmationNumber: "bad" };
    const cleaned = sanitizeReservationList([first, duplicate, invalid, null]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]?.quantity).toBe(2);
  });

  it("keeps orphaned reservations when the catalog event was removed", () => {
    const orphan = sampleReservation({
      confirmationNumber: "EH-ORPH-AN01",
      eventId: "deleted-event-id",
      eventTitle: "Ghost Night",
      eventImage: "/demos/event-horizon/events/aurora.svg",
    });
    const cleaned = sanitizeReservationList([orphan], {
      knownEventIds: new Set(events.map((event) => event.id)),
    });
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]?.eventTitle).toBe("Ghost Night");
    expect(cleaned[0]?.eventId).toBe("deleted-event-id");
  });

  it("cancels without deleting history and supports permanent delete", () => {
    const reservation = sampleReservation({
      confirmationNumber: "EH-CANC-EL01",
    });
    const withCancel = cancelReservation([reservation], "EH-CANC-EL01");
    expect(withCancel[0]?.status).toBe("Cancelled");
    expect(withCancel).toHaveLength(1);
    expect(getReservationDisplayStatus(withCancel[0]!)).toBe("Cancelled");

    const removed = deleteReservation(withCancel, "EH-CANC-EL01");
    expect(removed).toEqual([]);
  });

  it("marks past non-cancelled reservations as Completed", () => {
    const past = sampleReservation({
      confirmationNumber: "EH-PAST-0001",
      eventDate: "2020-01-01T20:00:00.000Z",
      status: "Upcoming",
    });
    expect(getReservationDisplayStatus(past, Date.parse("2026-07-23"))).toBe(
      "Completed",
    );
  });

  it("ignores duplicate adds by confirmation number", () => {
    const reservation = sampleReservation({
      confirmationNumber: "EH-DUPE-0001",
    });
    const once = addReservation([], reservation);
    const twice = addReservation(once, { ...reservation, quantity: 5 });
    expect(twice).toHaveLength(1);
    expect(twice[0]?.quantity).toBe(2);
  });
});

describe("favorites persistence helpers", () => {
  it("drops invalid IDs, duplicates, and deleted events", () => {
    const known = new Set(events.map((event) => event.id));
    expect(
      sanitizeFavoriteIds(
        [events[0].id, events[0].id, "missing-id", 42, "", null, events[1].id],
        known,
      ),
    ).toEqual([events[0].id, events[1].id]);
  });

  it("parses a valid favorites payload from storage", () => {
    const payload = JSON.stringify([events[0].id, "gone-event"]);
    expect(loadFavoritesFromStorage(payload)).toEqual([events[0].id]);
  });
});

describe("not-found routing", () => {
  it("resolves known event ids and marks unknown ids as not-found", () => {
    expect(resolveEventRoute(events[0].id).status).toBe("found");
    expect(resolveEventRoute(events[0].slug).status).toBe("found");
    expect(isEventNotFoundRoute("not-a-real-event")).toBe(true);
    expect(resolveEventRoute("not-a-real-event")).toEqual({
      status: "not-found",
      id: "not-a-real-event",
    });
  });
});

describe("loading states", () => {
  it("exposes accessible loading labels on skeletons", () => {
    const markup = renderToStaticMarkup(
      createElement(EventGridSkeleton, { count: 2 }),
    );
    expect(markup).toContain(EVENT_GRID_LOADING_LABEL);
    expect(markup).toContain('aria-busy="true"');
    expect(EVENT_DETAIL_LOADING_LABEL).toBe("Loading event");
  });
});

describe("trending ranking", () => {
  it("scores featured scarcity and returns a ranked list", () => {
    const now = Date.parse("2026-08-08T12:00:00-05:00");
    const ranked = getTrendingEvents(events, 3, now);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.length).toBeLessThanOrEqual(3);

    const topScore = getTrendingScore(ranked[0]!, now);
    const secondScore = ranked[1] ? getTrendingScore(ranked[1], now) : 0;
    expect(topScore).toBeGreaterThan(0);
    if (ranked[1]) expect(topScore).toBeGreaterThanOrEqual(secondScore);
  });

  it("returns zero for cancelled events", () => {
    const cancelled = {
      ...events[0],
      status: "cancelled" as const,
    };
    expect(getTrendingScore(cancelled, Date.parse("2026-08-08"))).toBe(0);
  });
});
