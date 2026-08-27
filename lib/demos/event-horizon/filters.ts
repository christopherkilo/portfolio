import {
  CATEGORIES,
  CITIES,
  DEFAULT_EVENT_FILTERS,
  type EventCategory,
  type EventFilters,
  type SortOption,
} from "@/lib/demos/event-horizon/eventData";
import type { EventSourceFilter } from "@/lib/demos/event-horizon/externalEvents";

const SORT_OPTIONS: SortOption[] = [
  "date-asc",
  "date-desc",
  "popular",
  "title",
];

const SOURCE_OPTIONS: EventSourceFilter[] = [
  "all",
  "event-horizon",
  "ticketmaster",
];

function isCategory(value: string): value is EventCategory | "All" {
  return value === "All" || (CATEGORIES as readonly string[]).includes(value);
}

function isSort(value: string): value is SortOption {
  return (SORT_OPTIONS as readonly string[]).includes(value);
}

function isCity(value: string): boolean {
  return value === "All" || (CITIES as readonly string[]).includes(value);
}

function isSource(value: string): value is EventSourceFilter {
  return (SOURCE_OPTIONS as readonly string[]).includes(value);
}

/** Parse browse filters from URLSearchParams / a plain record. */
export function parseEventFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): EventFilters {
  const read = (key: string): string => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? "";
    }
    const raw = params[key];
    if (Array.isArray(raw)) return raw[0] ?? "";
    return raw ?? "";
  };

  const query = read("q").trim();
  const categoryRaw = read("category");
  const cityRaw = read("city");
  const date = read("date").trim();
  const sortRaw = read("sort");
  const featuredRaw = read("featured").toLowerCase();
  const sourceRaw = read("source").toLowerCase();

  return {
    query,
    category: isCategory(categoryRaw) ? categoryRaw : DEFAULT_EVENT_FILTERS.category,
    city: isCity(cityRaw) && cityRaw ? cityRaw : DEFAULT_EVENT_FILTERS.city,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    sort: isSort(sortRaw) ? sortRaw : DEFAULT_EVENT_FILTERS.sort,
    featured: featuredRaw === "true" || featuredRaw === "1",
    source: isSource(sourceRaw) ? sourceRaw : DEFAULT_EVENT_FILTERS.source,
  };
}

/** Serialize filters to a query string without empty/default clutter. */
export function serializeEventFilters(filters: EventFilters): string {
  const params = new URLSearchParams();

  const query = filters.query.trim();
  if (query) params.set("q", query);

  if (filters.category !== "All") params.set("category", filters.category);

  if (filters.city && filters.city !== "All") params.set("city", filters.city);

  if (filters.date) params.set("date", filters.date);

  if (filters.sort !== DEFAULT_EVENT_FILTERS.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.featured) params.set("featured", "true");

  if (filters.source !== DEFAULT_EVENT_FILTERS.source) {
    params.set("source", filters.source);
  }

  return params.toString();
}

export function buildBrowseHref(filters: EventFilters): string {
  const qs = serializeEventFilters(filters);
  return qs
    ? `/demos/event-horizon/browse?${qs}`
    : "/demos/event-horizon/browse";
}
