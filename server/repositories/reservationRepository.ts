import "server-only";

import type { Prisma, ReservationStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export async function findReservationByIdempotencyKey(
  userId: string,
  idempotencyKey: string,
) {
  return prisma.reservation.findFirst({
    where: { userId, idempotencyKey },
  });
}

export async function findReservationById(id: string) {
  return prisma.reservation.findUnique({ where: { id } });
}

export async function listReservationsForUser(
  userId: string,
  options: {
    status?: ReservationStatus | "all";
    page: number;
    pageSize: number;
  },
) {
  const where: Prisma.ReservationWhereInput = { userId };
  if (options.status && options.status !== "all") {
    where.status = options.status;
  }

  const skip = (options.page - 1) * options.pageSize;
  const [total, rows] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      orderBy: { reservedAt: "desc" },
      skip,
      take: options.pageSize,
    }),
  ]);

  return { total, rows };
}

export type CreateReservationData = {
  confirmationNumber: string;
  idempotencyKey: string;
  userId: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  unitPriceInCents: number;
  subtotalInCents: number;
  feeInCents: number;
  totalInCents: number;
  currency: string;
  eventTitleSnapshot: string;
  eventImageSnapshot: string;
  venueSnapshot: string;
  eventDateSnapshot: Date;
  ticketTypeNameSnapshot: string;
};

/**
 * Atomically decrement inventory (conditional) and create reservation.
 * Returns null when inventory condition fails.
 */
export async function createReservationWithInventory(
  data: CreateReservationData,
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.ticketType.updateMany({
      where: {
        id: data.ticketTypeId,
        eventId: data.eventId,
        availability: { in: ["available", "limited"] },
        quantityRemaining: { gte: data.quantity },
      },
      data: {
        quantityRemaining: { decrement: data.quantity },
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    const ticket = await tx.ticketType.findUnique({
      where: { id: data.ticketTypeId },
    });

    if (ticket && ticket.quantityRemaining <= 0) {
      await tx.ticketType.update({
        where: { id: data.ticketTypeId },
        data: { availability: "sold_out", quantityRemaining: 0 },
      });
    } else if (
      ticket &&
      ticket.quantityRemaining > 0 &&
      ticket.quantityRemaining <= Math.max(10, Math.floor(ticket.purchaseLimit))
    ) {
      await tx.ticketType.update({
        where: { id: data.ticketTypeId },
        data: { availability: "limited" },
      });
    }

    const reservation = await tx.reservation.create({
      data: {
        ...data,
        status: "confirmed",
      },
    });

    return reservation;
  });
}

/**
 * Soft-cancel reservation and restore inventory once.
 */
export async function cancelReservationWithInventory(
  reservationId: string,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!existing) return { kind: "missing" as const };
    if (existing.userId !== userId) return { kind: "forbidden" as const };
    if (existing.status === "cancelled") {
      return { kind: "already" as const, reservation: existing };
    }

    const updated = await tx.reservation.updateMany({
      where: {
        id: reservationId,
        userId,
        status: "confirmed",
      },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      const again = await tx.reservation.findUnique({
        where: { id: reservationId },
      });
      return { kind: "already" as const, reservation: again! };
    }

    await tx.ticketType.update({
      where: { id: existing.ticketTypeId },
      data: {
        quantityRemaining: { increment: existing.quantity },
        availability: "available",
      },
    });

    const reservation = await tx.reservation.findUniqueOrThrow({
      where: { id: reservationId },
    });

    return { kind: "cancelled" as const, reservation };
  });
}
