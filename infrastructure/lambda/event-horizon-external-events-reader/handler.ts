import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  parseReaderQuery,
  ReaderValidationError,
  selectFutureExternalEvents,
  type PublicExternalEvent,
  type ReaderQuery,
} from "./sanitize";

export interface FunctionUrlEvent {
  requestContext?: { http?: { method?: string } };
  queryStringParameters?: Record<string, string | undefined> | null;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface ExternalEventsStore {
  queryByProvider(provider: string): Promise<unknown[]>;
}

export interface ReaderSuccessBody {
  provider: string;
  count: number;
  items: PublicExternalEvent[];
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=30",
};

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

function tableName(): string {
  const name = process.env.EXTERNAL_EVENTS_TABLE_NAME;
  if (!name) {
    throw new Error("EXTERNAL_EVENTS_TABLE_NAME is not set.");
  }
  return name;
}

export const dynamoStore: ExternalEventsStore = {
  async queryByProvider(provider) {
    const result = await documentClient.send(
      new QueryCommand({
        TableName: tableName(),
        KeyConditionExpression: "provider = :provider",
        ExpressionAttributeValues: {
          ":provider": provider,
        },
      }),
    );
    return result.Items ?? [];
  },
};

export async function handler(event: FunctionUrlEvent): Promise<HttpResponse> {
  return processReaderRequest(event, dynamoStore);
}

export async function processReaderRequest(
  event: FunctionUrlEvent,
  store: ExternalEventsStore,
  now: Date = new Date(),
): Promise<HttpResponse> {
  const method = (event.requestContext?.http?.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    return json(405, { error: "Method not allowed." });
  }

  let query: ReaderQuery;
  try {
    query = parseReaderQuery(event.queryStringParameters);
  } catch (error) {
    const message =
      error instanceof ReaderValidationError ? error.message : "Invalid request.";
    return json(400, { error: message });
  }

  try {
    const items = await store.queryByProvider(query.provider);
    const selected = selectFutureExternalEvents(items, now, query.limit);
    console.log(
      JSON.stringify({
        msg: "reader-complete",
        provider: query.provider,
        scanned: items.length,
        returned: selected.length,
      }),
    );
    const body: ReaderSuccessBody = {
      provider: query.provider,
      count: selected.length,
      items: selected,
    };
    return json(200, body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown reader error.";
    console.error(
      JSON.stringify({
        msg: "reader-failed",
        error: sanitizeLogError(message),
      }),
    );
    return json(500, { error: "External events are temporarily unavailable." });
  }
}

function json(statusCode: number, body: unknown): HttpResponse {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

function sanitizeLogError(message: string): string {
  return message
    .replace(/arn:aws:[^\s]+/gi, "arn:aws:REDACTED")
    .replace(/([?&]apikey=)[^&]*/gi, "$1REDACTED")
    .slice(0, 240);
}
