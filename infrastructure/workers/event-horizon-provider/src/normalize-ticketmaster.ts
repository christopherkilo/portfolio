import {
  TICKETMASTER_PROVIDER,
  type IngestionMessage,
  type TicketmasterImage,
} from "./types";

const PREFERRED_RATIO = "16_9";
const MIN_LANDSCAPE_WIDTH = 640;
const PREFERRED_LANDSCAPE_WIDTH = 1024;

export interface TicketmasterNormalizeResult {
  events: IngestionMessage[];
  skipped: number;
}

export function normalizeTicketmasterEvents(
  rawEvents: unknown[],
  now: Date,
): TicketmasterNormalizeResult {
  const events: IngestionMessage[] = [];
  let skipped = 0;

  for (const raw of rawEvents) {
    const normalized = normalizeTicketmasterEvent(raw, now);
    if (normalized) {
      events.push(normalized);
    } else {
      skipped += 1;
    }
  }

  return { events, skipped };
}

export function normalizeTicketmasterEvent(
  raw: unknown,
  now: Date,
): IngestionMessage | undefined {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const event = raw as Record<string, unknown>;
  const externalId = optionalString(event.id);
  const title = optionalString(event.name);
  if (!externalId || !title) {
    return undefined;
  }

  const startsAt = ticketmasterStartsAt(event, now);
  if (!startsAt) {
    return undefined;
  }

  const message: IngestionMessage = {
    provider: TICKETMASTER_PROVIDER,
    externalId,
    title,
    startsAt: startsAt.toISOString(),
  };

  const sourceUrl = optionalString(event.url);
  if (sourceUrl) message.sourceUrl = sourceUrl;

  const venue = firstVenue(event);
  if (venue) {
    const venueName = optionalString(venue.name);
    const city = nestedName(venue.city);
    const state = venueState(venue.state);
    const { latitude, longitude } = venueCoordinates(venue.location);
    if (venueName) message.venueName = venueName;
    if (city) message.city = city;
    if (state) message.state = state;
    if (latitude !== undefined) message.latitude = latitude;
    if (longitude !== undefined) message.longitude = longitude;
  }

  const classification = firstClassification(event.classifications);
  if (classification) {
    const category = nestedName(classification.segment);
    const genre = nestedName(classification.genre);
    if (category) message.category = category;
    if (genre) message.genre = genre;
  }

  const imageUrl = selectEventImageUrl(event.images);
  if (imageUrl) message.imageUrl = imageUrl;

  return message;
}

export function selectEventImageUrl(images: unknown): string | undefined {
  if (!Array.isArray(images)) {
    return undefined;
  }

  const candidates = images
    .map(parseImage)
    .filter((image): image is TicketmasterImage => image !== undefined)
    .sort(compareImages);

  return candidates[0]?.url;
}

function parseImage(value: unknown): TicketmasterImage | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const image = value as Record<string, unknown>;
  const url = optionalString(image.url);
  if (!url || !/^https:\/\//i.test(url)) {
    return undefined;
  }

  return {
    url,
    ratio: optionalString(image.ratio),
    width: optionalFiniteNumber(image.width),
    height: optionalFiniteNumber(image.height),
    fallback: image.fallback === true,
  };
}

function compareImages(a: TicketmasterImage, b: TicketmasterImage): number {
  const scoreDiff = imageScore(b) - imageScore(a);
  if (scoreDiff !== 0) return scoreDiff;
  const widthDiff = (b.width ?? 0) - (a.width ?? 0);
  if (widthDiff !== 0) return widthDiff;
  return a.url.localeCompare(b.url);
}

function imageScore(image: TicketmasterImage): number {
  let score = 0;
  if (!image.fallback) score += 1_000;
  if (image.ratio === PREFERRED_RATIO) score += 100;
  if ((image.width ?? 0) >= PREFERRED_LANDSCAPE_WIDTH) score += 20;
  else if ((image.width ?? 0) >= MIN_LANDSCAPE_WIDTH) score += 10;
  return score;
}

function ticketmasterStartsAt(event: Record<string, unknown>, now: Date): Date | undefined {
  const dates = asRecord(event.dates);
  const start = asRecord(dates?.start);
  if (!start) return undefined;

  if (start.dateTBA === true || start.dateTBD === true || start.timeTBA === true) {
    return undefined;
  }

  const dateTime = optionalString(start.dateTime);
  if (!dateTime) return undefined;

  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) return undefined;
  if (parsed.getTime() <= now.getTime()) return undefined;
  return parsed;
}

function firstVenue(event: Record<string, unknown>): Record<string, unknown> | undefined {
  const embedded = asRecord(event._embedded);
  const venues = embedded?.venues;
  if (!Array.isArray(venues) || venues.length === 0) return undefined;
  return asRecord(venues[0]);
}

function firstClassification(value: unknown): Record<string, unknown> | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const primary = value.map(asRecord).find((item) => item?.primary === true);
  return primary ?? asRecord(value[0]);
}

function venueState(value: unknown): string | undefined {
  const state = asRecord(value);
  if (!state) return undefined;
  return optionalString(state.stateCode) ?? optionalString(state.name);
}

function venueCoordinates(value: unknown): {
  latitude?: number;
  longitude?: number;
} {
  const location = asRecord(value);
  if (!location) return {};
  const latitude = optionalLatitude(location.latitude);
  const longitude = optionalLongitude(location.longitude);
  return { latitude, longitude };
}

function nestedName(value: unknown): string | undefined {
  const record = asRecord(value);
  const name = optionalString(record?.name);
  if (!name || /^undefined$/i.test(name)) return undefined;
  return name;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || undefined;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function optionalLatitude(value: unknown): number | undefined {
  const parsed = optionalFiniteNumber(value);
  if (parsed === undefined || parsed < -90 || parsed > 90) return undefined;
  return parsed;
}

function optionalLongitude(value: unknown): number | undefined {
  const parsed = optionalFiniteNumber(value);
  if (parsed === undefined || parsed < -180 || parsed > 180) return undefined;
  return parsed;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}
