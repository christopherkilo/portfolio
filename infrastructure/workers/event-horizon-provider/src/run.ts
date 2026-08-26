import { loadWorkerConfig } from "./config";
import { normalizeTicketmasterEvents } from "./normalize-ticketmaster";
import {
  fetchTicketmasterEvents,
  type TicketmasterFetchOptions,
} from "./providers/ticketmaster";
import type { IngestionMessage, WorkerConfig } from "./types";

export interface WorkerSender {
  send(queueUrl: string, body: string): Promise<void>;
}

export interface WorkerLogger {
  info(fields: Record<string, unknown>): void;
  error(fields: Record<string, unknown>): void;
}

export interface WorkerResult {
  received: number;
  normalized: number;
  skipped: number;
  sent: number;
  failed: Array<{ provider: string; externalId: string; error: string }>;
}

export interface WorkerRuntimeOptions extends TicketmasterFetchOptions {}

const defaultLogger: WorkerLogger = {
  info(fields) {
    console.log(JSON.stringify(fields));
  },
  error(fields) {
    console.error(JSON.stringify(fields));
  },
};

export function toQueueBody(event: IngestionMessage): string {
  return JSON.stringify({
    provider: event.provider,
    externalId: event.externalId,
    title: event.title,
    startsAt: event.startsAt,
    ...(event.city ? { city: event.city } : {}),
    ...(event.state ? { state: event.state } : {}),
    ...(event.sourceUrl ? { sourceUrl: event.sourceUrl } : {}),
    ...(event.venueName ? { venueName: event.venueName } : {}),
    ...(event.imageUrl ? { imageUrl: event.imageUrl } : {}),
    ...(event.category ? { category: event.category } : {}),
    ...(event.genre ? { genre: event.genre } : {}),
    ...(event.latitude !== undefined ? { latitude: event.latitude } : {}),
    ...(event.longitude !== undefined ? { longitude: event.longitude } : {}),
  });
}

export async function runWorker(
  env: NodeJS.Dict<string>,
  sender: WorkerSender,
  logger: WorkerLogger = defaultLogger,
  options: WorkerRuntimeOptions = {},
): Promise<WorkerResult> {
  logger.info({ msg: "worker-start" });

  const config = loadWorkerConfig(env);
  const now = options.now ?? new Date();
  const fetched = await fetchProviderEvents(config, logger, { ...options, now });
  const { events, skipped } = normalizeTicketmasterEvents(fetched.events, now);

  logger.info({ msg: "provider-events-normalized", count: events.length });
  logger.info({ msg: "provider-events-skipped", count: skipped });

  const result: WorkerResult = {
    received: fetched.received,
    normalized: events.length,
    skipped,
    sent: 0,
    failed: [],
  };

  for (const event of events) {
    try {
      await sender.send(config.queueUrl, toQueueBody(event));
      result.sent += 1;
      logger.info({
        msg: "message-sent",
        provider: event.provider,
        externalId: event.externalId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown send error.";
      result.failed.push({
        provider: event.provider,
        externalId: event.externalId,
        error: message,
      });
      logger.error({
        msg: "message-failed",
        provider: event.provider,
        externalId: event.externalId,
        error: message,
      });
    }
  }

  logger.info({
    msg: "worker-complete",
    received: result.received,
    normalized: result.normalized,
    skipped: result.skipped,
    sent: result.sent,
    failed: result.failed.length,
  });

  if (result.failed.length > 0) {
    throw new Error(
      `Ingestion worker finished with ${result.failed.length} failed message(s).`,
    );
  }

  return result;
}

async function fetchProviderEvents(
  config: WorkerConfig,
  logger: WorkerLogger,
  options: WorkerRuntimeOptions,
) {
  logger.info({
    msg: "provider-fetch-start",
    provider: config.provider,
  });

  const fetched = await fetchTicketmasterEvents(config, options);
  logger.info({
    msg: "provider-events-received",
    count: fetched.received,
  });
  return fetched;
}
