/**
 * Seeds Event Horizon catalog from the Phase 1–3 mock data module.
 * Uses upserts so repeated runs do not create duplicates.
 *
 * Requires DATABASE_URL.
 */
import "dotenv/config";
import {
  PrismaClient,
  type EventCategory,
  type EventStatus,
  type TicketAvailability,
} from "@prisma/client";
import { events } from "../lib/demos/event-horizon/eventData";

const prisma = new PrismaClient();

function mapStatus(status: string): EventStatus {
  if (status === "sold-out") return "sold_out";
  if (status === "cancelled") return "cancelled";
  if (status === "postponed") return "postponed";
  return "upcoming";
}

function mapAvailability(availability: string): TicketAvailability {
  if (availability === "sold-out") return "sold_out";
  if (availability === "limited") return "limited";
  return "available";
}

function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

async function main() {
  console.log(`Seeding ${events.length} Event Horizon events…`);

  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      create: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        shortDescription: event.shortDescription,
        description: event.description,
        category: event.category as EventCategory,
        venue: event.venue,
        city: event.city,
        state: event.state,
        country: event.country,
        address: event.address,
        timezone: event.timezone,
        startDateTime: new Date(event.startDateTime),
        endDateTime: new Date(event.endDateTime),
        image: event.image,
        gallery: event.gallery,
        featured: event.featured,
        tags: event.tags,
        capacity: event.capacity,
        status: mapStatus(event.status),
        organizer: event.organizer,
      },
      update: {
        slug: event.slug,
        title: event.title,
        shortDescription: event.shortDescription,
        description: event.description,
        category: event.category as EventCategory,
        venue: event.venue,
        city: event.city,
        state: event.state,
        country: event.country,
        address: event.address,
        timezone: event.timezone,
        startDateTime: new Date(event.startDateTime),
        endDateTime: new Date(event.endDateTime),
        image: event.image,
        gallery: event.gallery,
        featured: event.featured,
        tags: event.tags,
        capacity: event.capacity,
        status: mapStatus(event.status),
        organizer: event.organizer,
      },
    });

    for (const ticket of event.ticketTypes) {
      await prisma.ticketType.upsert({
        where: { id: ticket.id },
        create: {
          id: ticket.id,
          eventId: event.id,
          name: ticket.name,
          description: ticket.description,
          priceInCents: dollarsToCents(ticket.price),
          currency: "USD",
          quantityRemaining: ticket.quantityRemaining,
          purchaseLimit: ticket.purchaseLimit,
          availability: mapAvailability(ticket.availability),
        },
        update: {
          eventId: event.id,
          name: ticket.name,
          description: ticket.description,
          priceInCents: dollarsToCents(ticket.price),
          currency: "USD",
          quantityRemaining: ticket.quantityRemaining,
          purchaseLimit: ticket.purchaseLimit,
          availability: mapAvailability(ticket.availability),
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
