import type { EventItem, TicketType } from "@/lib/demos/event-horizon/eventData";
import { getTicketById, isUpcomingEvent } from "@/lib/demos/event-horizon/eventData";

/** Percentage service fee applied to ticket subtotal. */
export const SERVICE_FEE_RATE = 0.08;

/** Flat service fee (USD) added per reservation. */
export const SERVICE_FEE_FLAT = 2.5;

export type ReservationTotals = {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  fees: number;
  total: number;
};

export type ReservationValidation =
  | { ok: true; ticket: TicketType }
  | { ok: false; error: string };

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateReservationTotals(
  unitPrice: number,
  quantity: number,
): ReservationTotals {
  const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
  const subtotal = roundCurrency(unitPrice * safeQuantity);
  const fees =
    safeQuantity < 1
      ? 0
      : roundCurrency(subtotal * SERVICE_FEE_RATE + SERVICE_FEE_FLAT);
  const total = roundCurrency(subtotal + fees);
  return {
    unitPrice,
    quantity: safeQuantity,
    subtotal,
    fees,
    total,
  };
}

export function validateReservation(
  event: EventItem,
  ticketId: string,
  quantity: number,
): ReservationValidation {
  if (!isUpcomingEvent(event)) {
    return { ok: false, error: "This event has already ended." };
  }
  if (event.status === "sold-out") {
    return { ok: false, error: "This event is sold out." };
  }
  if (event.status === "cancelled") {
    return { ok: false, error: "This event has been cancelled." };
  }
  if (event.status === "postponed") {
    return { ok: false, error: "This event has been postponed." };
  }

  const ticket = getTicketById(event, ticketId);
  if (!ticket) {
    return { ok: false, error: "Select a valid ticket type." };
  }
  if (
    ticket.availability === "sold-out" ||
    ticket.quantityRemaining <= 0
  ) {
    return { ok: false, error: "That ticket type is unavailable." };
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, error: "Quantity must be at least 1." };
  }
  if (quantity > ticket.purchaseLimit) {
    return {
      ok: false,
      error: `You can purchase up to ${ticket.purchaseLimit} of this ticket.`,
    };
  }
  if (quantity > ticket.quantityRemaining) {
    return {
      ok: false,
      error: `Only ${ticket.quantityRemaining} ticket${ticket.quantityRemaining === 1 ? "" : "s"} remaining.`,
    };
  }

  return { ok: true, ticket };
}

/** Demo confirmation numbers: EH-XXXX-XXXX (A–Z / 0–9). */
export function createConfirmationNumber(seed?: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let source =
    seed ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.toUpperCase();
  source = source.replace(/[^A-Z0-9]/g, "");
  while (source.length < 8) {
    source += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const chunk = source.slice(0, 8);
  return `EH-${chunk.slice(0, 4)}-${chunk.slice(4, 8)}`;
}

export function isConfirmationNumber(value: string): boolean {
  return /^EH-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(value);
}
