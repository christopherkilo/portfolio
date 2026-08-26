/**
 * Deterministic demo fixtures retained for Phase 1/2 contract tests only.
 * The production worker path uses Ticketmaster, not these events.
 */
import type { IngestionMessage } from "./types";

export type { IngestionMessage } from "./types";

export const DEMO_PROVIDER = "ecs-demo-provider";

export const DEMO_EVENTS: readonly IngestionMessage[] = [
  {
    provider: DEMO_PROVIDER,
    externalId: "ecs-demo-001",
    title: "Cedar Chamber Night",
    city: "Cleveland",
    state: "OH",
    startsAt: "2026-11-06T19:00:00.000Z",
    sourceUrl: "https://example.com/events/ecs-demo-001",
  },
  {
    provider: DEMO_PROVIDER,
    externalId: "ecs-demo-002",
    title: "Harbor Lights Festival",
    city: "Chicago",
    state: "IL",
    startsAt: "2026-11-13T18:30:00.000Z",
    sourceUrl: "https://example.com/events/ecs-demo-002",
  },
  {
    provider: DEMO_PROVIDER,
    externalId: "ecs-demo-003",
    title: "Lumen Yoga Dawn",
    city: "Austin",
    state: "TX",
    startsAt: "2026-11-20T20:00:00.000Z",
    sourceUrl: "https://example.com/events/ecs-demo-003",
  },
];

export function buildDemoEvents(): IngestionMessage[] {
  return DEMO_EVENTS.map((event) => ({ ...event }));
}

export function demoEventKeys(): Array<{ provider: string; externalId: string }> {
  return DEMO_EVENTS.map((event) => ({
    provider: event.provider,
    externalId: event.externalId,
  }));
}
