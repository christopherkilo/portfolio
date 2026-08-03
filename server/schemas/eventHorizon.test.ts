import { describe, expect, it } from "vitest";
import {
  eventQuerySchema,
  favoriteCreateSchema,
  reservationCreateSchema,
} from "@/server/schemas/eventHorizon";
import {
  calculateReservationTotalsCents,
  createConfirmationNumber,
  isConfirmationNumber,
} from "@/server/domain/reservationMath";

describe("eventHorizon Zod schemas", () => {
  it("rejects negative and decimal quantities", () => {
    expect(() =>
      reservationCreateSchema.parse({
        eventId: "aurora-synth-night",
        ticketTypeId: "aurora-ga",
        quantity: -1,
        idempotencyKey: "eh_abcdefgh",
      }),
    ).toThrow();

    expect(() =>
      reservationCreateSchema.parse({
        eventId: "aurora-synth-night",
        ticketTypeId: "aurora-ga",
        quantity: 1.5,
        idempotencyKey: "eh_abcdefgh",
      }),
    ).toThrow();
  });

  it("rejects malformed ids and idempotency keys", () => {
    expect(() =>
      favoriteCreateSchema.parse({ eventId: "bad id!" }),
    ).toThrow();
    expect(() =>
      reservationCreateSchema.parse({
        eventId: "aurora-synth-night",
        ticketTypeId: "aurora-ga",
        quantity: 1,
        idempotencyKey: "short",
      }),
    ).toThrow();
  });

  it("accepts valid browse queries", () => {
    const parsed = eventQuerySchema.parse({
      q: "music",
      category: "Music",
      city: "Austin",
      sort: "popular",
      featured: true,
      page: "2",
      pageSize: "12",
    });
    expect(parsed.page).toBe(2);
    expect(parsed.featured).toBe(true);
  });
});

describe("server reservation math", () => {
  it("calculates fees in integer cents", () => {
    // $35 * 2 = $70 → 7000 cents; fee = round(7000*0.08)+250 = 560+250 = 810
    const totals = calculateReservationTotalsCents(3500, 2);
    expect(totals.subtotalInCents).toBe(7000);
    expect(totals.feeInCents).toBe(810);
    expect(totals.totalInCents).toBe(7810);
  });

  it("creates confirmation numbers in EH-XXXX-XXXX format", () => {
    const code = createConfirmationNumber("seedvalue01");
    expect(isConfirmationNumber(code)).toBe(true);
  });
});
