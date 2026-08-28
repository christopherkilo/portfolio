import { NotificationValidationError, TransientNotificationError } from "./errors";
import { logNotificationEvent } from "./log";
import { processNotificationRecord, type SqsRecord } from "./processRecord";
import { dynamoStatusWriter } from "./status";

export interface SqsEvent {
  Records: SqsRecord[];
}

export interface SqsBatchResponse {
  batchItemFailures: Array<{ itemIdentifier: string }>;
}

export async function processSqsBatch(
  event: SqsEvent,
  writer = dynamoStatusWriter,
): Promise<SqsBatchResponse> {
  const records = event.Records ?? [];
  const batchItemFailures: Array<{ itemIdentifier: string }> = [];

  for (const record of records) {
    try {
      await processNotificationRecord(record, writer);
    } catch (error) {
      logNotificationEvent("resend.notification.batch_item_failed", {
        messageId: record.messageId,
        failureType: error instanceof Error ? error.name : "unknown",
        status:
          error instanceof NotificationValidationError
            ? "validation"
            : error instanceof TransientNotificationError
              ? "transient"
              : "failed",
      });
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

export async function handler(event: SqsEvent): Promise<SqsBatchResponse> {
  return processSqsBatch(event);
}
