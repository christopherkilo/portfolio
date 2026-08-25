import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/server/repositories/eventRepository", () => ({
  findEventById: vi.fn(),
}));

vi.mock("@/server/repositories/reservationRepository", () => ({
  findReservationByIdempotencyKey: vi.fn(),
  createReservationWithInventory: vi.fn(),
  cancelReservationWithInventory: vi.fn(),
}));

import * as eventRepository from "@/server/repositories/eventRepository";
import * as reservationRepository from "@/server/repositories/reservationRepository";
import {
  cancelReservation,
  createReservation,
} from "@/server/services/reservationService";
import { InventoryError, NotFoundError } from "@/server/errors/AppError";

const baseEvent = {
  id: "aurora-synth-night",
  slug: "aurora-synth-night",
  title: "Aurora Synth Night",
  shortDescription: "desc",
  description: "long",
  category: "Music" as const,
  venue: "Lumen Yard",
  city: "Austin",
  state: "TX",
  country: "US",
  address: "addr",
  timezone: "America/Chicago",
  startDateTime: new Date("2026-09-25T20:00:00-05:00"),
  endDateTime: new Date("2026-09-26T01:00:00-05:00"),
  image: "/img.svg",
  gallery: ["/img.svg"],
  featured: true,
  tags: ["electronic"],
  capacity: 900,
  status: "upcoming" as const,
  organizer: "Signal",
  createdAt: new Date(),
  updatedAt: new Date(),
  ticketTypes: [
    {
      id: "aurora-ga",
      eventId: "aurora-synth-night",
      name: "General Admission",
      description: "GA",
      priceInCents: 3500,
      currency: "USD",
      quantityRemaining: 10,
      purchaseLimit: 6,
      availability: "available" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

describe("reservationService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects missing events", async () => {
    vi.mocked(eventRepository.findEventById).mockResolvedValue(null);
    vi.mocked(
      reservationRepository.findReservationByIdempotencyKey,
    ).mockResolvedValue(null);

    await expect(
      createReservation("user-1", {
        eventId: "missing",
        ticketTypeId: "aurora-ga",
        quantity: 1,
        idempotencyKey: "eh_testkey01",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects sold-out inventory from repository", async () => {
    vi.mocked(eventRepository.findEventById).mockResolvedValue(baseEvent);
    vi.mocked(
      reservationRepository.findReservationByIdempotencyKey,
    ).mockResolvedValue(null);
    vi.mocked(
      reservationRepository.createReservationWithInventory,
    ).mockResolvedValue(null);

    await expect(
      createReservation("user-1", {
        eventId: "aurora-synth-night",
        ticketTypeId: "aurora-ga",
        quantity: 2,
        idempotencyKey: "eh_testkey02",
      }),
    ).rejects.toBeInstanceOf(InventoryError);
  });

  it("replays idempotent reservations", async () => {
    const existing = {
      id: "res-1",
      confirmationNumber: "EH-TEST-0001",
      idempotencyKey: "eh_testkey03",
      userId: "user-1",
      eventId: "aurora-synth-night",
      ticketTypeId: "aurora-ga",
      quantity: 2,
      unitPriceInCents: 3500,
      subtotalInCents: 7000,
      feeInCents: 810,
      totalInCents: 7810,
      currency: "USD",
      status: "confirmed" as const,
      reservedAt: new Date(),
      cancelledAt: null,
      eventTitleSnapshot: "Aurora Synth Night",
      eventImageSnapshot: "/img.svg",
      venueSnapshot: "Lumen Yard",
      eventDateSnapshot: new Date("2026-09-25T20:00:00-05:00"),
      ticketTypeNameSnapshot: "General Admission",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(
      reservationRepository.findReservationByIdempotencyKey,
    ).mockResolvedValue(existing);

    const result = await createReservation("user-1", {
      eventId: "aurora-synth-night",
      ticketTypeId: "aurora-ga",
      quantity: 2,
      idempotencyKey: "eh_testkey03",
    });

    expect(result.replayed).toBe(true);
    expect(result.reservation.confirmationNumber).toBe("EH-TEST-0001");
    expect(
      reservationRepository.createReservationWithInventory,
    ).not.toHaveBeenCalled();
  });

  it("blocks cancel for another user", async () => {
    vi.mocked(
      reservationRepository.cancelReservationWithInventory,
    ).mockResolvedValue({ kind: "forbidden" });

    await expect(cancelReservation("user-1", "res-1")).rejects.toMatchObject({
      status: 403,
    });
  });
});
