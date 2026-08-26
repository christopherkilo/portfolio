import {
  TICKETMASTER_PROVIDER,
  type WorkerConfig,
} from "./types";

const MAX_PAGE_SIZE = 200;

export function requireQueueUrl(
  env: NodeJS.Dict<string> = process.env,
): string {
  const url = env.INGESTION_QUEUE_URL?.trim();
  if (!url) {
    throw new Error("INGESTION_QUEUE_URL is required.");
  }
  return url;
}

export function loadWorkerConfig(
  env: NodeJS.Dict<string> = process.env,
): WorkerConfig {
  const queueUrl = requireQueueUrl(env);
  const provider = required(env, "EVENT_PROVIDER");
  if (provider !== TICKETMASTER_PROVIDER) {
    throw new Error(`Unsupported EVENT_PROVIDER: ${provider}.`);
  }

  const pageSizeRaw = required(env, "EVENT_PAGE_SIZE");
  const pageSize = Number.parseInt(pageSizeRaw, 10);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new Error("EVENT_PAGE_SIZE must be an integer between 1 and 200.");
  }

  const ticketmasterApiKey = normalizeApiKey(env.TICKETMASTER_API_KEY);
  if (!ticketmasterApiKey) {
    throw new Error("TICKETMASTER_API_KEY is required.");
  }

  return {
    queueUrl,
    provider: TICKETMASTER_PROVIDER,
    city: required(env, "EVENT_CITY"),
    stateCode: required(env, "EVENT_STATE_CODE"),
    countryCode: required(env, "EVENT_COUNTRY_CODE"),
    pageSize,
    ticketmasterApiKey,
  };
}

function required(env: NodeJS.Dict<string>, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function normalizeApiKey(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^apikey=/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}
