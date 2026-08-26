/**
 * Pure ingestion helpers. Keep AWS I/O out of this file so unit tests
 * can validate Event Horizon external-event records without calling AWS.
 */

export const REQUIRED_FIELDS = ["provider", "externalId", "title", "startsAt"] as const;

const TTL_AFTER_START_MS = 7 * 24 * 60 * 60 * 1000;
const FALLBACK_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_EVENT_YEAR = 2000;
const MAX_EVENT_YEAR = 2100;

export class IngestionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestionValidationError";
  }
}

export interface ExternalEventInput {
  provider?: unknown;
  externalId?: unknown;
  title?: unknown;
  city?: unknown;
  state?: unknown;
  startsAt?: unknown;
  sourceUrl?: unknown;
  venueName?: unknown;
  imageUrl?: unknown;
  category?: unknown;
  genre?: unknown;
  latitude?: unknown;
  longitude?: unknown;
}

export interface ExternalEventRecord {
  provider: string;
  externalId: string;
  title: string;
  city?: string;
  state?: string;
  startsAt: string;
  sourceUrl?: string;
  venueName?: string;
  imageUrl?: string;
  category?: string;
  genre?: string;
  latitude?: number;
  longitude?: number;
  ingestedAt: string;
  updatedAt: string;
  /** DynamoDB TTL attribute: Unix epoch seconds. */
  expiresAt: number;
}

export interface DynamoKey {
  provider: string;
  externalId: string;
}

export function dynamoKey(provider: string, externalId: string): DynamoKey {
  return {
    provider: normalizeRequiredString("provider", provider).toLowerCase(),
    externalId: normalizeRequiredString("externalId", externalId),
  };
}

export function normalizeExternalEvent(
  input: unknown,
  now: Date = new Date(),
): ExternalEventRecord {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new IngestionValidationError("Event body must be a JSON object.");
  }

  const raw = input as ExternalEventInput;
  const provider = normalizeRequiredString("provider", raw.provider).toLowerCase();
  const externalId = normalizeRequiredString("externalId", raw.externalId);
  const title = normalizeRequiredString("title", raw.title);
  const startsAtDate = parseStartsAt(normalizeRequiredString("startsAt", raw.startsAt));
  const timestamp = now.toISOString();

  const record: ExternalEventRecord = {
    provider,
    externalId,
    title,
    startsAt: startsAtDate.toISOString(),
    ingestedAt: timestamp,
    updatedAt: timestamp,
    expiresAt: expiresAtEpochSeconds(startsAtDate, now),
  };

  const city = normalizeOptionalString(raw.city);
  const state = normalizeOptionalString(raw.state);
  const sourceUrl = normalizeOptionalString(raw.sourceUrl);
  const venueName = normalizeOptionalString(raw.venueName);
  const imageUrl = normalizeOptionalString(raw.imageUrl);
  const category = normalizeOptionalString(raw.category);
  const genre = normalizeOptionalString(raw.genre);
  const latitude = normalizeOptionalNumber(raw.latitude);
  const longitude = normalizeOptionalNumber(raw.longitude);
  if (city) record.city = city;
  if (state) record.state = state;
  if (sourceUrl) record.sourceUrl = sourceUrl;
  if (venueName) record.venueName = venueName;
  if (imageUrl) record.imageUrl = imageUrl;
  if (category) record.category = category;
  if (genre) record.genre = genre;
  if (latitude !== undefined) record.latitude = latitude;
  if (longitude !== undefined) record.longitude = longitude;

  return record;
}

export function parseJsonBody(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new IngestionValidationError("Event body is not valid JSON.");
  }
}

function normalizeRequiredString(field: string, value: unknown): string {
  if (typeof value !== "string") {
    throw new IngestionValidationError(`Missing required field: ${field}.`);
  }
  const normalized = collapseWhitespace(value);
  if (!normalized) {
    throw new IngestionValidationError(`Missing required field: ${field}.`);
  }
  return normalized;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const normalized = collapseWhitespace(value);
  return normalized || undefined;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function parseStartsAt(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new IngestionValidationError("Invalid startsAt timestamp.");
  }

  const year = date.getUTCFullYear();
  if (year < MIN_EVENT_YEAR || year > MAX_EVENT_YEAR) {
    throw new IngestionValidationError("Invalid startsAt timestamp.");
  }

  return date;
}

function expiresAtEpochSeconds(startsAt: Date, now: Date): number {
  const fromStart = startsAt.getTime() + TTL_AFTER_START_MS;
  const fallback = now.getTime() + FALLBACK_TTL_MS;
  return Math.floor(Math.max(fromStart, fallback) / 1000);
}
