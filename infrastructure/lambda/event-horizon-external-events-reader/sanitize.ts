/**
 * Pure reader helpers. Keep AWS I/O out of this file so unit tests
 * can validate public Ticketmaster payloads without calling DynamoDB.
 */

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;
export const ALLOWED_PROVIDERS = ["ticketmaster"] as const;

export type AllowedProvider = (typeof ALLOWED_PROVIDERS)[number];

export class ReaderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReaderValidationError";
  }
}

export interface PublicExternalEvent {
  provider: string;
  externalId: string;
  title: string;
  startsAt: string;
  city?: string;
  state?: string;
  venueName?: string;
  sourceUrl?: string;
  imageUrl?: string;
  category?: string;
  genre?: string;
  latitude?: number;
  longitude?: number;
}

export interface ReaderQuery {
  provider: AllowedProvider;
  limit: number;
}

export function parseReaderQuery(
  params: Record<string, string | undefined> | null | undefined,
): ReaderQuery {
  const providerRaw = (params?.provider ?? "ticketmaster").trim().toLowerCase();
  if (!ALLOWED_PROVIDERS.includes(providerRaw as AllowedProvider)) {
    throw new ReaderValidationError("Unsupported provider.");
  }

  const limitRaw = params?.limit?.trim();
  let limit = DEFAULT_LIMIT;
  if (limitRaw) {
    const parsed = Number.parseInt(limitRaw, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
      throw new ReaderValidationError(`limit must be an integer between 1 and ${MAX_LIMIT}.`);
    }
    limit = parsed;
  }

  return {
    provider: providerRaw as AllowedProvider,
    limit,
  };
}

export function toPublicExternalEvent(item: unknown): PublicExternalEvent | undefined {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    return undefined;
  }

  const raw = item as Record<string, unknown>;
  const provider = optionalString(raw.provider)?.toLowerCase();
  const externalId = optionalString(raw.externalId);
  const title = optionalString(raw.title);
  const startsAt = optionalString(raw.startsAt);
  if (!provider || !externalId || !title || !startsAt) {
    return undefined;
  }

  const startsAtDate = new Date(startsAt);
  if (Number.isNaN(startsAtDate.getTime())) {
    return undefined;
  }

  const event: PublicExternalEvent = {
    provider,
    externalId,
    title,
    startsAt: startsAtDate.toISOString(),
  };

  const city = optionalString(raw.city);
  const state = optionalString(raw.state);
  const venueName = optionalString(raw.venueName);
  const sourceUrl = optionalHttpsUrl(raw.sourceUrl);
  const imageUrl = optionalHttpsUrl(raw.imageUrl);
  const category = optionalString(raw.category);
  const genre = optionalString(raw.genre);
  const latitude = optionalFiniteNumber(raw.latitude);
  const longitude = optionalFiniteNumber(raw.longitude);

  if (city) event.city = city;
  if (state) event.state = state;
  if (venueName) event.venueName = venueName;
  if (sourceUrl) event.sourceUrl = sourceUrl;
  if (imageUrl) event.imageUrl = imageUrl;
  if (category) event.category = category;
  if (genre) event.genre = genre;
  if (latitude !== undefined) event.latitude = latitude;
  if (longitude !== undefined) event.longitude = longitude;

  return event;
}

export function selectFutureExternalEvents(
  items: unknown[],
  now: Date,
  limit: number,
): PublicExternalEvent[] {
  const nowMs = now.getTime();
  return items
    .map(toPublicExternalEvent)
    .filter((event): event is PublicExternalEvent => {
      if (!event) return false;
      return Date.parse(event.startsAt) > nowMs;
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, limit);
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || undefined;
}

function optionalHttpsUrl(value: unknown): string | undefined {
  const url = optionalString(value);
  if (!url || !/^https:\/\//i.test(url)) return undefined;
  return url;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}
