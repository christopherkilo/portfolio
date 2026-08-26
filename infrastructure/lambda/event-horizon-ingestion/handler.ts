import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
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
  put(record: ExternalEventRecord): Promise<void>;
}

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

export const dynamoWriter: IngestionWriter = {
  async put(record) {
    await documentClient.send(
      new PutCommand({
        TableName: tableName(),
        Item: record,
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
      await writer.put(item);
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
