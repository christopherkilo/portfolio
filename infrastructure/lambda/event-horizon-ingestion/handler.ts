import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  IngestionValidationError,
  normalizeExternalEvent,
  parseJsonBody,
  type ExternalEventRecord,
} from "./normalize";

export interface SqsRecord {
  messageId: string;
  body: string;
}

export interface SqsEvent {
  Records: SqsRecord[];
}

export interface SqsBatchResponse {
  batchItemFailures: Array<{ itemIdentifier: string }>;
}

export interface IngestionWriter {
  upsert(record: ExternalEventRecord): Promise<void>;
}

export interface ExternalEventUpdate {
  Key: { provider: string; externalId: string };
  UpdateExpression: string;
  ExpressionAttributeNames: { "#state": "state" };
  ExpressionAttributeValues: Record<string, string | number>;
}

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

function applyOptionalString(
  field: string,
  value: string | undefined,
  setClauses: string[],
  remove: string[],
  values: Record<string, string | number>,
): void {
  if (value !== undefined) {
    setClauses.push(`${field} = :${field}`);
    values[`:${field}`] = value;
  } else {
    remove.push(field);
  }
}

function applyOptionalNumber(
  field: string,
  value: number | undefined,
  setClauses: string[],
  remove: string[],
  values: Record<string, string | number>,
): void {
  if (value !== undefined) {
    setClauses.push(`${field} = :${field}`);
    values[`:${field}`] = value;
  } else {
    remove.push(field);
  }
}

function tableName(): string {
  const name = process.env.EXTERNAL_EVENTS_TABLE_NAME;
  if (!name) {
    throw new Error("EXTERNAL_EVENTS_TABLE_NAME is not set.");
  }
  return name;
}

/** Atomic upsert: update mutable fields, set ingestedAt only on first write. */
export function buildExternalEventUpdate(record: ExternalEventRecord): ExternalEventUpdate {
  const setClauses = [
    "title = :title",
    "startsAt = :startsAt",
    "updatedAt = :updatedAt",
    "expiresAt = :expiresAt",
    "ingestedAt = if_not_exists(ingestedAt, :ingestedAt)",
  ];
  const remove: string[] = [];
  const values: Record<string, string | number> = {
    ":title": record.title,
    ":startsAt": record.startsAt,
    ":updatedAt": record.updatedAt,
    ":expiresAt": record.expiresAt,
    ":ingestedAt": record.ingestedAt,
  };

  if (record.city) {
    setClauses.push("city = :city");
    values[":city"] = record.city;
  } else {
    remove.push("city");
  }
  if (record.state) {
    setClauses.push("#state = :state");
    values[":state"] = record.state;
  } else {
    remove.push("#state");
  }
  if (record.sourceUrl) {
    setClauses.push("sourceUrl = :sourceUrl");
    values[":sourceUrl"] = record.sourceUrl;
  } else {
    remove.push("sourceUrl");
  }

  applyOptionalString("venueName", record.venueName, setClauses, remove, values);
  applyOptionalString("imageUrl", record.imageUrl, setClauses, remove, values);
  applyOptionalString("category", record.category, setClauses, remove, values);
  applyOptionalString("genre", record.genre, setClauses, remove, values);
  applyOptionalNumber("latitude", record.latitude, setClauses, remove, values);
  applyOptionalNumber("longitude", record.longitude, setClauses, remove, values);

  const parts = [`SET ${setClauses.join(", ")}`];
  if (remove.length > 0) {
    parts.push(`REMOVE ${remove.join(", ")}`);
  }

  return {
    Key: { provider: record.provider, externalId: record.externalId },
    UpdateExpression: parts.join(" "),
    ExpressionAttributeNames: { "#state": "state" },
    ExpressionAttributeValues: values,
  };
}

export const dynamoWriter: IngestionWriter = {
  async upsert(record) {
    const update = buildExternalEventUpdate(record);
    await documentClient.send(
      new UpdateCommand({
        TableName: tableName(),
        ...update,
      }),
    );
  },
};

export async function handler(event: SqsEvent): Promise<SqsBatchResponse> {
  return processSqsBatch(event, dynamoWriter);
}

export async function processSqsBatch(
  event: SqsEvent,
  writer: IngestionWriter,
  now: Date = new Date(),
): Promise<SqsBatchResponse> {
  const records = event.Records ?? [];
  console.log(
    JSON.stringify({
      msg: "received",
      count: records.length,
    }),
  );

  const batchItemFailures: Array<{ itemIdentifier: string }> = [];

  for (const record of records) {
    try {
      const parsed = parseJsonBody(record.body);
      const item = normalizeExternalEvent(parsed, now);
      await writer.upsert(item);
      console.log(
        JSON.stringify({
          msg: "ingested",
          provider: item.provider,
          externalId: item.externalId,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown ingestion error.";
      console.error(
        JSON.stringify({
          msg: "failed",
          messageId: record.messageId,
          error: message,
          validation: error instanceof IngestionValidationError,
        }),
      );
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}
