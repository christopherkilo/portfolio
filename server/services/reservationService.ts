import "server-only";

import {
  AuthorizationError,
  ConflictError,
  InventoryError,
  NotFoundError,
  ValidationError,
} from "@/server/errors/AppError";
import {
  calculateReservationTotalsCents,
  createConfirmationNumber,
} from "@/server/domain/reservationMath";
import { mapReservation } from "@/server/mappers/eventHorizon";
import * as eventRepository from "@/server/repositories/eventRepository";
import * as reservationRepository from "@/server/repositories/reservationRepository";
import type { ReservationCreateInput } from "@/server/schemas/eventHorizon";

export async function listUserReservations(
  userId: string,
  options: {
    status?: "confirmed" | "cancelled" | "all";
    page: number;
    pageSize: number;
  },
) {
  const { total, rows } = await reservationRepository.listReservationsForUser(
    userId,
    {
      status: options.status ?? "all",
      page: options.page,
      pageSize: options.pageSize,
    },
  );

  return {
    items: rows.map((row) => mapReservation(row)),
    page: options.page,
    pageSize: options.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
  };
}

export async function createReservation(
  userId: string,
  input: ReservationCreateInput,
) {
  const existing =
    await reservationRepository.findReservationByIdempotencyKey(
      userId,
      input.idempotencyKey,
    );
  if (existing) {
    return { reservation: mapReservation(existing), replayed: true };
  }

  const event = await eventRepository.findEventById(input.eventId);
  if (!event) {
    throw new NotFoundError("That event no longer exists.");
  }

  if (event.status === "cancelled") {
    throw new ConflictError("This event has been cancelled.");
  }
  if (event.status === "postponed") {
    throw new ConflictError("This event has been postponed.");
  }
  if (event.status === "sold_out") {
    throw new InventoryError("This event is sold out.");
  }

  const ticket = event.ticketTypes.find(
    (item) => item.id === input.ticketTypeId,
  );
  if (!ticket) {
    throw new NotFoundError("Select a valid ticket type.");
  }
  if (ticket.eventId !== event.id) {
    throw new ValidationError("Ticket does not belong to this event.", {
      ticketTypeId: ["Ticket does not belong to this event."],
    });
  }
  if (
    ticket.availability === "sold_out" ||
    ticket.quantityRemaining <= 0
  ) {
    throw new InventoryError("That ticket type is unavailable.");
  }
  if (input.quantity > ticket.purchaseLimit) {
    throw new ValidationError(
      `You can purchase up to ${ticket.purchaseLimit} of this ticket.`,
      {
        quantity: [
          `You can purchase up to ${ticket.purchaseLimit} of this ticket.`,
        ],
      },
    );
  }
  if (input.quantity > ticket.quantityRemaining) {
    throw new InventoryError(
      `Only ${ticket.quantityRemaining} ticket${ticket.quantityRemaining === 1 ? "" : "s"} remaining.`,
    );
  }

  const totals = calculateReservationTotalsCents(
    ticket.priceInCents,
    input.quantity,
  );

  const created = await reservationRepository.createReservationWithInventory({
    confirmationNumber: createConfirmationNumber(event.id),
    idempotencyKey: input.idempotencyKey,
    userId,
    eventId: event.id,
    ticketTypeId: ticket.id,
    quantity: input.quantity,
    unitPriceInCents: totals.unitPriceInCents,
    subtotalInCents: totals.subtotalInCents,
    feeInCents: totals.feeInCents,
    totalInCents: totals.totalInCents,
    currency: ticket.currency,
    eventTitleSnapshot: event.title,
    eventImageSnapshot: event.image,
    venueSnapshot: event.venue,
    eventDateSnapshot: event.startDateTime,
    ticketTypeNameSnapshot: ticket.name,
  });

  if (!created) {
    throw new InventoryError("Only one ticket remains or inventory changed.");
  }

  return { reservation: mapReservation(created), replayed: false };
}

export async function cancelReservation(userId: string, reservationId: string) {
  const result = await reservationRepository.cancelReservationWithInventory(
    reservationId,
    userId,
  );

  if (result.kind === "missing") {
    throw new NotFoundError("Reservation not found.");
  }
  if (result.kind === "forbidden") {
    throw new AuthorizationError(
      "You do not have permission to cancel this reservation.",
    );
  }

  return {
    reservation: mapReservation(result.reservation),
    alreadyCancelled: result.kind === "already",
  };
}
