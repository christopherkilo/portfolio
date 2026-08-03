import type { EventItem, TicketType } from "@/lib/demos/event-horizon/eventData";
import { events, getEventById } from "@/lib/demos/event-horizon/eventData";
import {
  calculateReservationTotals,
  isConfirmationNumber,
} from "@/lib/demos/event-horizon/reservation";
import { safeParseJson } from "@/lib/demos/event-horizon/storage";

export const RESERVATIONS_STORAGE_KEY = "event-horizon-reservations";

export type ReservationStatus = "Upcoming" | "Completed" | "Cancelled";

export type ReservationRecord = {
  confirmationNumber: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  venue: string;
  /** Event start ISO datetime (snapshot). */
  eventDate: string;
  ticketType: string;
  ticketTypeId: string;
  quantity: number;
  subtotal: number;
  fees: number;
  total: number;
  /** Reservation creation ISO timestamp. */
  reservedAt: string;
  /**
   * Stored status is Upcoming or Cancelled.
   * Completed is derived from the event date when not cancelled.
   */
  status: "Upcoming" | "Cancelled";
};

export type CreateReservationInput = {
  confirmationNumber: string;
  event: EventItem;
  ticket: TicketType;
  quantity: number;
  reservedAt?: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Narrow unknown JSON into a reservation when the shape is usable. */
export function isReservationRecord(value: unknown): value is ReservationRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;

  if (!isConfirmationNumber(String(record.confirmationNumber ?? ""))) {
    return false;
  }
  if (!isNonEmptyString(record.eventId)) return false;
  if (!isNonEmptyString(record.eventTitle)) return false;
  if (!isNonEmptyString(record.eventImage)) return false;
  if (!isNonEmptyString(record.venue)) return false;
  if (!isNonEmptyString(record.eventDate)) return false;
  if (!isNonEmptyString(record.ticketType)) return false;
  if (!isNonEmptyString(record.ticketTypeId)) return false;
  if (!isFiniteNumber(record.quantity) || record.quantity < 1) return false;
  if (!isFiniteNumber(record.subtotal)) return false;
  if (!isFiniteNumber(record.fees)) return false;
  if (!isFiniteNumber(record.total)) return false;
  if (!isNonEmptyString(record.reservedAt)) return false;
  if (record.status !== "Upcoming" && record.status !== "Cancelled") {
    return false;
  }

  return true;
}

export function createReservationRecord(
  input: CreateReservationInput,
): ReservationRecord {
  const totals = calculateReservationTotals(
    input.ticket.price,
    input.quantity,
  );

  return {
    confirmationNumber: input.confirmationNumber,
    eventId: input.event.id,
    eventTitle: input.event.title,
    eventImage: input.event.image,
    venue: input.event.venue,
    eventDate: input.event.startDateTime,
    ticketType: input.ticket.name,
    ticketTypeId: input.ticket.id,
    quantity: input.quantity,
    subtotal: totals.subtotal,
    fees: totals.fees,
    total: totals.total,
    reservedAt: input.reservedAt ?? new Date().toISOString(),
    status: "Upcoming",
  };
}

/**
 * Display status for a reservation.
 * Cancelled stays cancelled; otherwise past event dates become Completed.
 */
export function getReservationDisplayStatus(
  reservation: ReservationRecord,
  now: number = Date.now(),
): ReservationStatus {
  if (reservation.status === "Cancelled") return "Cancelled";
  const eventEnd = Date.parse(reservation.eventDate);
  if (Number.isFinite(eventEnd) && eventEnd < now) return "Completed";
  return "Upcoming";
}

/** Soft-cancel: keep history, mark Cancelled. */
export function cancelReservation(
  list: ReservationRecord[],
  confirmationNumber: string,
): ReservationRecord[] {
  return list.map((reservation) =>
    reservation.confirmationNumber === confirmationNumber
      ? { ...reservation, status: "Cancelled" as const }
      : reservation,
  );
}

/** Permanent deletion from the local list. */
export function deleteReservation(
  list: ReservationRecord[],
  confirmationNumber: string,
): ReservationRecord[] {
  return list.filter(
    (reservation) => reservation.confirmationNumber !== confirmationNumber,
  );
}

/**
 * Deduplicate by confirmation number (first wins) and drop invalid entries.
 * Snapshot fields are kept even when the catalog event was removed.
 */
export function sanitizeReservationList(
  raw: unknown,
  options: { knownEventIds?: Set<string> } = {},
): ReservationRecord[] {
  if (!Array.isArray(raw)) return [];

  const knownEventIds =
    options.knownEventIds ?? new Set(events.map((event) => event.id));
  const seen = new Set<string>();
  const cleaned: ReservationRecord[] = [];

  for (const item of raw) {
    if (!isReservationRecord(item)) continue;
    if (seen.has(item.confirmationNumber)) continue;
    seen.add(item.confirmationNumber);

    // Keep orphaned event snapshots; optionally refresh live metadata when present.
    const live = knownEventIds.has(item.eventId)
      ? getEventById(item.eventId)
      : undefined;

    cleaned.push(
      live
        ? {
            ...item,
            eventTitle: live.title,
            eventImage: live.image,
            venue: live.venue,
            eventDate: live.startDateTime,
          }
        : item,
    );
  }

  return cleaned;
}

export function loadReservationsFromStorage(raw: string | null): ReservationRecord[] {
  if (raw == null || raw === "") return [];
  const parsed = safeParseJson(raw);
  return sanitizeReservationList(parsed);
}

export function serializeReservations(list: ReservationRecord[]): string {
  return JSON.stringify(list);
}

/** Insert a reservation, ignoring exact confirmation duplicates. */
export function addReservation(
  list: ReservationRecord[],
  reservation: ReservationRecord,
): ReservationRecord[] {
  if (list.some((item) => item.confirmationNumber === reservation.confirmationNumber)) {
    return list;
  }
  return [reservation, ...list];
}
