import "server-only";

import { prisma } from "@/server/db/prisma";

export async function listFavoritesForUser(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          ticketTypes: { orderBy: { priceInCents: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findFavorite(userId: string, eventId: string) {
  return prisma.favorite.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
}

export async function createFavorite(userId: string, eventId: string) {
  return prisma.favorite.create({
    data: { userId, eventId },
    include: {
      event: {
        include: {
          ticketTypes: { orderBy: { priceInCents: "asc" } },
        },
      },
    },
  });
}

export async function deleteFavorite(userId: string, eventId: string) {
  return prisma.favorite.deleteMany({
    where: { userId, eventId },
  });
}
