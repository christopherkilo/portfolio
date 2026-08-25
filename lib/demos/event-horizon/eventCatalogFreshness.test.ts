import { describe, expect, it } from "vitest";
import {
  events,
  filterEvents,
  DEFAULT_EVENT_FILTERS,
  isUpcomingEvent,
} from "./eventData";
import {
  getFeaturedDiscoveryEvents,
  getHomeDiscoverySections,
} from "./discovery";

describe("Event Horizon catalog freshness", () => {
  it("keeps seeded upcoming events in the future", () => {
    const now = Date.now();
    const upcoming = events.filter((event) => event.status === "upcoming");
    expect(upcoming.length).toBeGreaterThan(0);
    for (const event of upcoming) {
      expect(Date.parse(event.endDateTime)).toBeGreaterThan(now);
      expect(isUpcomingEvent(event, now)).toBe(true);
    }
  });

  it("does not present ended or cancelled events as upcoming on discovery rails", () => {
    const now = Date.now();
    const expired = {
      ...events[0]!,
      id: "expired-fixture",
      status: "upcoming" as const,
      startDateTime: "2026-01-01T18:00:00-06:00",
      endDateTime: "2026-01-01T22:00:00-06:00",
    };
    const cancelled = {
      ...events[0]!,
      id: "cancelled-fixture",
      status: "cancelled" as const,
      startDateTime: "2026-12-01T18:00:00-06:00",
      endDateTime: "2026-12-01T22:00:00-06:00",
    };
    const sections = getHomeDiscoverySections(
      [...events, expired, cancelled],
      now,
    );
    const featured = getFeaturedDiscoveryEvents(
      [...events, expired, cancelled],
      now,
    );

    for (const section of sections) {
      expect(section.events.some((event) => event.id === expired.id)).toBe(
        false,
      );
      expect(section.events.some((event) => event.id === cancelled.id)).toBe(
        false,
      );
      for (const event of section.events) {
        expect(isUpcomingEvent(event, now)).toBe(true);
      }
    }
    expect(featured.some((event) => event.id === expired.id)).toBe(false);
  });

  it("excludes expired events from browse filtering", () => {
    const expired = {
      ...events[0]!,
      id: "expired-browse",
      startDateTime: "2025-01-01T18:00:00-06:00",
      endDateTime: "2025-01-01T22:00:00-06:00",
    };
    const result = filterEvents([expired, ...events], DEFAULT_EVENT_FILTERS);
    expect(result.some((event) => event.id === "expired-browse")).toBe(false);
    expect(result.every((event) => isUpcomingEvent(event))).toBe(true);
  });
});
