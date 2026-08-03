import { getEventById, type EventItem } from "@/lib/demos/event-horizon/eventData";

export type EventRouteResult =
  | { status: "found"; event: EventItem }
  | { status: "not-found"; id: string };

/** Resolve an event detail route id/slug for pages and tests. */
export function resolveEventRoute(id: string): EventRouteResult {
  const event = getEventById(id);
  if (!event) return { status: "not-found", id };
  return { status: "found", event };
}

export function isEventNotFoundRoute(id: string): boolean {
  return resolveEventRoute(id).status === "not-found";
}
