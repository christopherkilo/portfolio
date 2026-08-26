import {
  TICKETMASTER_EVENTS_URL,
  type ProviderFetchResult,
  type WorkerConfig,
} from "../types";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 600;

export class TicketmasterProviderError extends Error {
  readonly status?: number;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: { status?: number; retryable?: boolean } = {},
  ) {
    super(message);
    this.name = "TicketmasterProviderError";
    this.status = options.status;
    this.retryable = options.retryable ?? false;
  }
}

export interface TicketmasterFetchOptions {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: Date;
  timeoutMs?: number;
  maxRetries?: number;
}

export function ticketmasterStartDateTime(now: Date): string {
  return now.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function redactSecrets(text: string, apiKey?: string): string {
  let redacted = text.replace(/([?&]apikey=)[^&]*/gi, "$1REDACTED");
  if (apiKey) {
    redacted = redacted.split(apiKey).join("REDACTED");
  }
  return redacted;
}

export function sanitizedTicketmasterEndpoint(url: URL): string {
  const copy = new URL(url.toString());
  copy.searchParams.delete("apikey");
  return copy.toString();
}

export async function fetchTicketmasterEvents(
  config: WorkerConfig,
  options: TicketmasterFetchOptions = {},
): Promise<ProviderFetchResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? new Date();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const url = buildTicketmasterUrl(config, now);

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await requestTicketmasterPage(
        fetchImpl,
        url,
        config.ticketmasterApiKey,
        timeoutMs,
      );
    } catch (error) {
      lastError = toProviderError(error, config.ticketmasterApiKey);
      if (
        !(lastError instanceof TicketmasterProviderError) ||
        !lastError.retryable ||
        attempt === maxRetries
      ) {
        throw lastError;
      }
      await sleep(INITIAL_BACKOFF_MS * 2 ** attempt);
    }
  }

  throw toProviderError(lastError, config.ticketmasterApiKey);
}

function buildTicketmasterUrl(config: WorkerConfig, now: Date): URL {
  const url = new URL(TICKETMASTER_EVENTS_URL);
  url.searchParams.set("apikey", config.ticketmasterApiKey);
  url.searchParams.set("city", config.city);
  url.searchParams.set("stateCode", config.stateCode);
  url.searchParams.set("countryCode", config.countryCode);
  url.searchParams.set("size", String(config.pageSize));
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("includeTBA", "no");
  url.searchParams.set("includeTBD", "no");
  url.searchParams.set("includeTest", "no");
  url.searchParams.set("startDateTime", ticketmasterStartDateTime(now));
  return url;
}

async function requestTicketmasterPage(
  fetchImpl: typeof fetch,
  url: URL,
  apiKey: string,
  timeoutMs: number,
): Promise<ProviderFetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "event-horizon-ingestion-worker/0.1",
      },
      signal: controller.signal,
    });
  } catch (error) {
    throw toProviderError(error, apiKey);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403) {
    const detail = await briefProviderDetail(response, apiKey);
    throw new TicketmasterProviderError(
      `Ticketmaster authentication failed (${response.status})${detail}.`,
      { status: response.status, retryable: false },
    );
  }

  if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
    throw new TicketmasterProviderError(
      `Ticketmaster provider failed (${response.status}).`,
      { status: response.status, retryable: true },
    );
  }

  if (!response.ok) {
    throw new TicketmasterProviderError(
      `Ticketmaster request failed (${response.status}).`,
      { status: response.status, retryable: false },
    );
  }

  const payload = await readJson(response, apiKey);
  return parseDiscoveryEvents(payload);
}

async function briefProviderDetail(response: Response, apiKey: string): Promise<string> {
  try {
    const text = redactSecrets((await response.text()).slice(0, 240), apiKey);
    if (!text) return "";
    try {
      const parsed = JSON.parse(text) as { fault?: { faultstring?: unknown } };
      const fault = typeof parsed.fault?.faultstring === "string" ? parsed.fault.faultstring.trim() : "";
      if (fault) return `: ${fault}`;
    } catch {
      // Keep a short non-JSON snippet only when it cannot contain secrets after redaction.
    }
    return "";
  } catch {
    return "";
  }
}
async function readJson(response: Response, apiKey: string): Promise<unknown> {
  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    throw toProviderError(error, apiKey);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new TicketmasterProviderError("Ticketmaster response is not valid JSON.", {
      retryable: false,
    });
  }
}

export function parseDiscoveryEvents(payload: unknown): ProviderFetchResult {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TicketmasterProviderError("Ticketmaster response has an unexpected shape.", {
      retryable: false,
    });
  }

  const embedded = (payload as { _embedded?: unknown })._embedded;
  if (embedded === undefined || embedded === null) {
    return { events: [], received: 0 };
  }
  if (typeof embedded !== "object" || Array.isArray(embedded)) {
    throw new TicketmasterProviderError("Ticketmaster response has an unexpected shape.", {
      retryable: false,
    });
  }

  const events = (embedded as { events?: unknown }).events;
  if (events === undefined || events === null) {
    return { events: [], received: 0 };
  }
  if (!Array.isArray(events)) {
    throw new TicketmasterProviderError("Ticketmaster response has an unexpected shape.", {
      retryable: false,
    });
  }

  return { events, received: events.length };
}

function toProviderError(error: unknown, apiKey: string): TicketmasterProviderError {
  if (error instanceof TicketmasterProviderError) {
    const redacted = redactSecrets(error.message, apiKey);
    if (redacted === error.message) {
      return error;
    }
    return new TicketmasterProviderError(redacted, {
      status: error.status,
      retryable: error.retryable,
    });
  }

  const retryable = isTimeoutError(error);
  const raw = error instanceof Error ? error.message : "Ticketmaster request failed.";
  return new TicketmasterProviderError(redactSecrets(raw, apiKey) || "Ticketmaster request failed.", {
    retryable,
  });
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "AbortError" || /aborted|timeout/i.test(error.message);
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
