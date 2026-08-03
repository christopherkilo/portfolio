import "server-only";

import { ConflictError, NotFoundError } from "@/server/errors/AppError";
import { mapEvent } from "@/server/mappers/eventHorizon";
import * as eventRepository from "@/server/repositories/eventRepository";
import * as favoriteRepository from "@/server/repositories/favoriteRepository";

export async function listUserFavorites(userId: string) {
  const rows = await favoriteRepository.listFavoritesForUser(userId);
  return rows.map((row) => ({
    id: row.id,
    eventId: row.eventId,
    createdAt: row.createdAt.toISOString(),
    event: mapEvent(row.event),
  }));
}

export async function addFavorite(userId: string, eventId: string) {
  const event = await eventRepository.findEventById(eventId);
  if (!event) {
    throw new NotFoundError("That event no longer exists.");
  }

  const existing = await favoriteRepository.findFavorite(userId, eventId);
  if (existing) {
    return {
      id: existing.id,
      eventId: existing.eventId,
      createdAt: existing.createdAt.toISOString(),
      event: mapEvent(event),
      created: false,
    };
  }

  try {
    const created = await favoriteRepository.createFavorite(userId, eventId);
    return {
      id: created.id,
      eventId: created.eventId,
      createdAt: created.createdAt.toISOString(),
      event: mapEvent(created.event),
      created: true,
    };
  } catch {
    // Unique constraint race: treat as success.
    const again = await favoriteRepository.findFavorite(userId, eventId);
    if (again) {
      return {
        id: again.id,
        eventId: again.eventId,
        createdAt: again.createdAt.toISOString(),
        event: mapEvent(event),
        created: false,
      };
    }
    throw new ConflictError("Unable to save favorite.");
  }
}

export async function removeFavorite(userId: string, eventId: string) {
  await favoriteRepository.deleteFavorite(userId, eventId);
  return { eventId, removed: true };
}
