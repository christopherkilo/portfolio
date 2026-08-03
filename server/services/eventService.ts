import "server-only";

import { NotFoundError } from "@/server/errors/AppError";
import { mapEvent } from "@/server/mappers/eventHorizon";
import type { EventQueryInput } from "@/server/schemas/eventHorizon";
import * as eventRepository from "@/server/repositories/eventRepository";

export async function listEvents(query: EventQueryInput) {
  const { total, rows } = await eventRepository.findEventsPage(query);
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return {
    items: rows.map(mapEvent),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
    filters: {
      q: query.q,
      category: query.category,
      city: query.city,
      date: query.date,
      sort: query.sort,
      featured: query.featured,
    },
  };
}

export async function getEvent(idOrSlug: string) {
  const event = await eventRepository.findEventByIdOrSlug(idOrSlug);
  if (!event) {
    throw new NotFoundError("That event no longer exists.");
  }
  return mapEvent(event);
}

export async function listFeaturedEvents(limit = 6) {
  const result = await eventRepository.findEventsPage({
    q: "",
    category: "All",
    city: "All",
    date: "",
    sort: "date-asc",
    featured: true,
    page: 1,
    pageSize: limit,
  });
  return result.rows.map(mapEvent);
}
