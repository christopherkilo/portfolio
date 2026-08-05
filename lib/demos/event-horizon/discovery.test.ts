import { describe, expect, it } from "vitest";
import { events } from "./eventData";
import {
  getBookedPercent,
  getHomeDiscoverySections,
  getSocialProof,
  getTimingLabel,
} from "./discovery";

describe("event horizon discovery", () => {
  it("builds non-empty curated homepage rails", () => {
    const sections = getHomeDiscoverySections(events);
    expect(sections.length).toBeGreaterThan(5);
    for (const section of sections) {
      expect(section.events.length).toBeGreaterThan(0);
      expect(section.viewAllHref).toContain("/demos/event-horizon");
    }
  });

  it("computes believable booked percent and social proof", () => {
    const event = events[0]!;
    const booked = getBookedPercent(event);
    expect(booked).toBeGreaterThanOrEqual(0);
    expect(booked).toBeLessThanOrEqual(100);
    const social = getSocialProof(event);
    expect(social.interested).toBeGreaterThan(0);
    expect(social.friendsAttending).toBeGreaterThan(0);
  });

  it("labels tonight-adjacent events", () => {
    const neon = events.find((event) => event.id === "neon-lane-sessions");
    expect(neon).toBeTruthy();
    const label = getTimingLabel(
      neon!,
      Date.parse("2026-08-04T18:00:00-05:00"),
    );
    expect(label).toBeTruthy();
  });
});
