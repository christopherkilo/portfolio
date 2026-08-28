import {
  createResendClient,
  ResendProviderError,
} from "../../../server/novatech/integrations/resendClient";
import {
  NotificationValidationError,
  PermanentNotificationError,
  TransientNotificationError,
} from "./errors";
import { logNotificationEvent } from "./log";
import { parseJsonBody, parseNotificationMessage } from "./schema";
import { getResendApiKey } from "./secrets";
import type { WorkflowStatusWriter } from "./status";

export interface SqsRecord {
  messageId: string;
  body: string;
  attributes?: { ApproximateReceiveCount?: string };
}

export async function processNotificationRecord(
  record: SqsRecord,
  writer: WorkflowStatusWriter,
  nowMs = Date.now(),
): Promise<void> {
  const receiveCount = Number(record.attributes?.ApproximateReceiveCount ?? "1");
  const startedAt = nowMs;

  let parsed: ReturnType<typeof parseNotificationMessage>;
  try {
    parsed = parseNotificationMessage(parseJsonBody(record.body));
  } catch (error) {
    logNotificationEvent("resend.notification.rejected", {
      messageId: record.messageId,
      receiveCount,
      failureType: error instanceof Error ? error.name : "unknown",
      errorCode: "INVALID_NOTIFICATION",
      status: "validation",
    });
    throw error instanceof NotificationValidationError
      ? error
      : new NotificationValidationError();
  }

  const base = {
    requestId: parsed.requestId,
    submissionId: parsed.submissionId,
    notificationId: parsed.notificationId,
    notificationType: parsed.type,
    receiveCount,
    messageId: record.messageId,
    operation: parsed.type,
  };

  logNotificationEvent("resend.notification.started", base);

  try {
    const apiKey = await getResendApiKey();
    const fromEmail = process.env.NOVATECH_FROM_EMAIL;
    const staffEmail = process.env.NOVATECH_STAFF_EMAIL;
    const appUrl = process.env.NOVATECH_APP_URL;
    if (!fromEmail || !staffEmail || !appUrl) {
      throw new PermanentNotificationError("Notification email configuration is incomplete.");
    }

    const client = createResendClient({
      apiKey,
      fromEmail,
      staffEmail,
      appUrl,
      maxRetries: 0,
      log: {
        info: (event, fields) => logNotificationEvent(event, fields),
        warn: (event, fields) => logNotificationEvent(event, fields),
        error: (event, fields) => logNotificationEvent(event, fields),
      },
    });

    if (parsed.type === "customer_confirmation") {
      await client.sendCustomerConfirmation({
        name: parsed.name,
        selectedService: parsed.selectedService,
        appUrl,
        recipient: parsed.recipient,
        requestId: parsed.requestId,
        submissionId: parsed.submissionId,
        notificationId: parsed.notificationId,
      });
    } else {
      await client.sendStaffNotification({
        name: parsed.name,
        visitorEmail: parsed.visitorEmail,
        company: parsed.company,
        selectedService: parsed.selectedService,
        companySize: parsed.companySize,
        urgency: parsed.urgency,
        preferredContactMethod: parsed.preferredContactMethod,
        submissionId: parsed.submissionId,
        contactId: parsed.contactId,
        dealId: parsed.dealId,
        requestId: parsed.requestId,
        notificationId: parsed.notificationId,
      });
    }

    await writer.markEmailResult({
      submissionId: parsed.submissionId,
      type: parsed.type,
      status: "SENT",
    });

    logNotificationEvent("resend.notification.succeeded", {
      ...base,
      status: "ok",
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    if (error instanceof NotificationValidationError) throw error;

    const httpStatus = error instanceof ResendProviderError ? error.httpStatus : undefined;
    const retryable =
      error instanceof TransientNotificationError ||
      (error instanceof ResendProviderError && error.retryable);

    if (retryable) {
      logNotificationEvent("resend.notification.failed", {
        ...base,
        status: "transient",
        httpStatus,
        durationMs: Date.now() - startedAt,
        failureType: error instanceof Error ? error.name : "unknown",
        errorCode: "EMAIL_UNAVAILABLE",
      });
      throw new TransientNotificationError();
    }

    logNotificationEvent("resend.notification.failed", {
      ...base,
      status: error instanceof ResendProviderError ? error.category : "permanent",
      httpStatus,
      durationMs: Date.now() - startedAt,
      failureType: error instanceof Error ? error.name : "unknown",
      errorCode: "EMAIL_UNAVAILABLE",
    });

    await writer.markEmailResult({
      submissionId: parsed.submissionId,
      type: parsed.type,
      status: "FAILED_PERMANENT",
    });
  }
}
