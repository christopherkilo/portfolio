import "server-only";

import type { EventCategory, EventStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type { EventQueryInput } from "@/server/schemas/eventHorizon";

const eventInclude = {
  ticketTypes: { orderBy: { priceInCents: "asc" as const } },
} satisfies Prisma.EventInclude;

export type EventWithTickets = Prisma.EventGetPayload<{
  include: typeof eventInclude;
}>;

function toDbStatus(status: string): EventStatus | undefined {
  if (status === "sold-out") return "sold_out";
  if (
    status === "upcoming" ||
    status === "cancelled" ||
    status === "postponed" ||
    status === "sold_out"
  ) {
    return status;
  }
  return undefined;
}

export async function findEventsPage(query: EventQueryInput) {
  const where: Prisma.EventWhereInput = {};

  const q = query.q.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { shortDescription: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { venue: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ];
  }

  if (query.category !== "All") {
    where.category = query.category as EventCategory;
  }

  if (query.city && query.city !== "All") {
    where.city = query.city;
  }

  if (query.date) {
    where.startDateTime = { gte: new Date(`${query.date}T00:00:00.000Z`) };
  }

  if (query.featured) {
    where.featured = true;
  }

  let orderBy: Prisma.EventOrderByWithRelationInput = {
    startDateTime: "asc",
  };
  switch (query.sort) {
    case "date-desc":
      orderBy = { startDateTime: "desc" };
      break;
    case "title":
      orderBy = { title: "asc" };
      break;
    case "popular":
      // Approximate popularity: lower remaining inventory first, then soonest.
      orderBy = { capacity: "desc" };
      break;
    default:
      orderBy = { startDateTime: "asc" };
  }

  const skip = (query.page - 1) * query.pageSize;

  const [total, rows] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy,
      skip,
      take: query.pageSize,
    }),
  ]);

  // Popular sort refined in memory on the page only (small pageSize).
  if (query.sort === "popular") {
    rows.sort((a, b) => {
      const aRemaining = a.ticketTypes.reduce(
        (sum, ticket) => sum + ticket.quantityRemaining,
        0,
      );
      const bRemaining = b.ticketTypes.reduce(
        (sum, ticket) => sum + ticket.quantityRemaining,
        0,
      );
      const aInterest = a.capacity - aRemaining;
      const bInterest = b.capacity - bRemaining;
      return bInterest - aInterest;
    });
  }

  return { total, rows };
}

export async function findEventByIdOrSlug(idOrSlug: string) {
  return prisma.event.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: eventInclude,
  });
}

export async function findEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: eventInclude,
  });
}

export { toDbStatus };
