import type { EventCategory, EventFilters } from "@/lib/demos/event-horizon/eventData";

export const EXTERNAL_EVENTS_API_ENV = "NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API";

export type ExternalEventSource = "ticketmaster";

export interface PublicExternalEvent {
  provider: string;
  externalId: string;
  title: string;
  startsAt: string;
  city?: string;
  state?: string;
  venueName?: string;
  sourceUrl?: string;
  imageUrl?: string;
  category?: string;
  genre?: string;
  latitude?: number;
  longitude?: number;
}

export type ExternalEventsStatus = "unconfigured" | "loading" | "ok" | "unavailable";

export interface ExternalEventsResult {
  status: Exclude<ExternalEventsStatus, "loading">;
  items: PublicExternalEvent[];
}

export type EventSourceFilter = "all" | "event-horizon" | "ticketmaster";

export function getExternalEventsApiUrl(
  env?: NodeJS.Dict<string>,
): string {
  // Next.js only inlines NEXT_PUBLIC_* when the identifier is a static
  // property access. Dynamic process.env[name] is empty in the browser.
  const raw = env
    ? env[EXTERNAL_EVENTS_API_ENV]
    : process.env.NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API;
  return (raw ?? "").trim().replace(/\/+$/, "");
}

export function getExternalEventCtaHref(event: PublicExternalEvent): string | undefined {
  const url = event.sourceUrl?.trim();
  if (!url || !/^https:\/\//i.test(url)) return undefined;
  return url;
}

export function externalEventSupportsReservation(): boolean {
  return false;
}

export function filterExternalEvents(
  items: PublicExternalEvent[],
  filters: Pick<EventFilters, "query" | "category" | "city" | "date">,
  now: Date = new Date(),
): PublicExternalEvent[] {
  const nowMs = now.getTime();
  const query = filters.query.trim().toLowerCase();

  return items
    .filter((event) => Date.parse(event.startsAt) > nowMs)
    .filter((event) => {
      if (!query) return true;
      return [event.title, event.venueName, event.city, event.category, event.genre]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .filter((event) => matchesCategory(event, filters.category))
    .filter((event) => {
      if (!filters.city || filters.city === "All") return true;
      return (event.city ?? "").toLowerCase() === filters.city.toLowerCase();
    })
    .filter((event) => {
      if (!filters.date) return true;
      return event.startsAt.slice(0, 10) >= filters.date;
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function shouldShowNativeCatalog(source: EventSourceFilter): boolean {
  return source !== "ticketmaster";
}

export function shouldShowExternalCatalog(
  source: EventSourceFilter,
  featured: boolean,
): boolean {
  return source !== "event-horizon" && !featured;
}

export async function fetchExternalEvents(
  options: { signal?: AbortSignal; limit?: number; env?: NodeJS.Dict<string> } = {},
): Promise<ExternalEventsResult> {
  const baseUrl = getExternalEventsApiUrl(options.env);
  if (!baseUrl) {
    return { status: "unconfigured", items: [] };
  }

  const url = new URL(baseUrl);
  url.searchParams.set("provider", "ticketmaster");
  url.searchParams.set("limit", String(options.limit ?? 40));

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: options.signal,
    });
    if (!response.ok) {
      return { status: "unavailable", items: [] };
    }
    const payload = (await response.json()) as { items?: unknown };
    const items = Array.isArray(payload.items)
      ? payload.items.filter(isPublicExternalEvent)
      : [];
    return { status: "ok", items };
  } catch {
    if (options.signal?.aborted) {
      return { status: "unconfigured", items: [] };
    }
    return { status: "unavailable", items: [] };
  }
}

function matchesCategory(
  event: PublicExternalEvent,
  category: EventCategory | "All",
): boolean {
  if (category === "All") return true;
  const haystack = `${event.category ?? ""} ${event.genre ?? ""}`.toLowerCase();
  return haystack.includes(category.toLowerCase());
}

function isPublicExternalEvent(value: unknown): value is PublicExternalEvent {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const raw = value as Record<string, unknown>;
  return (
    typeof raw.provider === "string" &&
    typeof raw.externalId === "string" &&
    typeof raw.title === "string" &&
    typeof raw.startsAt === "string"
  );
}
