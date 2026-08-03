import "server-only";

import type {
  Event,
  EventStatus,
  Reservation,
  TicketAvailability,
  TicketType,
} from "@prisma/client";

export type PublicTicketType = {
  id: string;
  name: string;
  description: string;
  /** Display dollars for existing UI compatibility. */
  price: number;
  priceInCents: number;
  currency: string;
  quantityRemaining: number;
  purchaseLimit: number;
  availability: "available" | "limited" | "sold-out";
};

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  address: string;
  timezone: string;
  startDateTime: string;
  endDateTime: string;
  image: string;
  gallery: string[];
  featured: boolean;
  tags: string[];
  capacity: number;
  status: "upcoming" | "sold-out" | "cancelled" | "postponed";
  organizer: string;
  ticketTypes: PublicTicketType[];
};

function mapStatus(status: EventStatus): PublicEvent["status"] {
  switch (status) {
    case "sold_out":
      return "sold-out";
    default:
      return status;
  }
}

function mapAvailability(
  availability: TicketAvailability,
): PublicTicketType["availability"] {
  return availability === "sold_out" ? "sold-out" : availability;
}

export function mapTicketType(ticket: TicketType): PublicTicketType {
  return {
    id: ticket.id,
    name: ticket.name,
    description: ticket.description,
    price: ticket.priceInCents / 100,
    priceInCents: ticket.priceInCents,
    currency: ticket.currency,
    quantityRemaining: ticket.quantityRemaining,
    purchaseLimit: ticket.purchaseLimit,
    availability: mapAvailability(ticket.availability),
  };
}

export function mapEvent(
  event: Event & { ticketTypes: TicketType[] },
): PublicEvent {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    shortDescription: event.shortDescription,
    description: event.description,
    category: event.category,
    venue: event.venue,
    city: event.city,
    state: event.state,
    country: event.country,
    address: event.address,
    timezone: event.timezone,
    startDateTime: event.startDateTime.toISOString(),
    endDateTime: event.endDateTime.toISOString(),
    image: event.image,
    gallery: event.gallery,
    featured: event.featured,
    tags: event.tags,
    capacity: event.capacity,
    status: mapStatus(event.status),
    organizer: event.organizer,
    ticketTypes: event.ticketTypes.map(mapTicketType),
  };
}

export type PublicReservation = {
  id: string;
  confirmationNumber: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  venue: string;
  eventDate: string;
  ticketType: string;
  ticketTypeId: string;
  quantity: number;
  subtotal: number;
  fees: number;
  total: number;
  subtotalInCents: number;
  feeInCents: number;
  totalInCents: number;
  currency: string;
  reservedAt: string;
  cancelledAt: string | null;
  status: "Upcoming" | "Completed" | "Cancelled";
  rawStatus: "confirmed" | "cancelled";
};

export function mapReservation(
  reservation: Reservation,
  now = Date.now(),
): PublicReservation {
  const rawStatus = reservation.status;
  let status: PublicReservation["status"] = "Upcoming";
  if (rawStatus === "cancelled") {
    status = "Cancelled";
  } else if (reservation.eventDateSnapshot.getTime() < now) {
    status = "Completed";
  }

  return {
    id: reservation.id,
    confirmationNumber: reservation.confirmationNumber,
    eventId: reservation.eventId,
    eventTitle: reservation.eventTitleSnapshot,
    eventImage: reservation.eventImageSnapshot,
    venue: reservation.venueSnapshot,
    eventDate: reservation.eventDateSnapshot.toISOString(),
    ticketType: reservation.ticketTypeNameSnapshot,
    ticketTypeId: reservation.ticketTypeId,
    quantity: reservation.quantity,
    subtotal: reservation.subtotalInCents / 100,
    fees: reservation.feeInCents / 100,
    total: reservation.totalInCents / 100,
    subtotalInCents: reservation.subtotalInCents,
    feeInCents: reservation.feeInCents,
    totalInCents: reservation.totalInCents,
    currency: reservation.currency,
    reservedAt: reservation.reservedAt.toISOString(),
    cancelledAt: reservation.cancelledAt?.toISOString() ?? null,
    status,
    rawStatus,
  };
}
