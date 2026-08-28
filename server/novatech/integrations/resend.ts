/**
 * Next.js Resend wrapper used by unit tests of the shared email client.
 * Production public inquiries do not call this module — AWS notification Lambda does.
 */
import "server-only";

import { getNovatechServerEnv } from "@/server/novatech/env";
import {
  ConfigurationError,
  EmailError,
} from "@/server/novatech/errors";
import {
  elapsedMs,
  emailDomainOnly,
  logger,
  nowMs,
  type InquiryLogContext,
} from "@/server/novatech/logger";
import { type NormalizedInquiry } from "@/server/novatech/mappers/inquiryMapper";
import type { HubSpotInquiryResult } from "@/server/novatech/integrations/hubspot";
import {
  createResendClient,
  ResendProviderError,
} from "@/server/novatech/integrations/resendClient";

export type EmailDeliveryResult = {
  visitorSent: boolean;
  staffSent: boolean;
};

export type ResendWorkflowContext = Pick<
  InquiryLogContext,
  "requestId" | "submissionId"
>;

/**
 * Send visitor confirmation + staff notification after CRM success.
 * Next.js path: in-process, after HubSpot. AWS path uses SQS instead.
 */
export async function sendInquiryEmails(
  inquiry: NormalizedInquiry,
  crm: HubSpotInquiryResult,
  context: ResendWorkflowContext,
): Promise<EmailDeliveryResult> {
  const started = nowMs();
  const base = {
    requestId: context.requestId,
    submissionId: context.submissionId,
    integration: "resend" as const,
    selectedService: inquiry.selectedService,
    emailDomain: emailDomainOnly(inquiry.businessEmail),
  };

  let env;
  try {
    env = getNovatechServerEnv();
  } catch {
    logger.error("resend.email.failed", {
      ...base,
      status: "missing_env",
      errorCode: "CONFIGURATION_ERROR",
      durationMs: elapsedMs(started),
    });
    throw new ConfigurationError(undefined, { alreadyLogged: true });
  }

  const client = createResendClient({
    apiKey: env.resendApiKey,
    fromEmail: env.fromEmail,
    staffEmail: env.staffEmail,
    appUrl: env.appUrl,
    maxRetries: 0,
    log: {
      info: (event, fields) => logger.info(event, fields as InquiryLogContext),
      warn: (event, fields) => logger.warn(event, fields as InquiryLogContext),
      error: (event, fields) => logger.error(event, fields as InquiryLogContext),
    },
  });

  const result: EmailDeliveryResult = {
    visitorSent: false,
    staffSent: false,
  };

  try {
    await client.sendCustomerConfirmation({
      name: inquiry.name,
      selectedService: inquiry.selectedService,
      appUrl: env.appUrl,
      recipient: inquiry.businessEmail,
      requestId: context.requestId,
      submissionId: inquiry.submissionId,
      notificationId: `${inquiry.submissionId}:customer`,
    });
    result.visitorSent = true;
  } catch (error) {
    logger.warn("resend.email.failed", {
      ...base,
      status: "visitor_failed",
      failureType: error instanceof ResendProviderError ? error.category : error instanceof Error ? error.name : "unknown",
      errorCode: "EMAIL_UNAVAILABLE",
      httpStatus: error instanceof ResendProviderError ? error.httpStatus : undefined,
      durationMs: elapsedMs(started),
    });
  }

  try {
    await client.sendStaffNotification({
      name: inquiry.name,
      visitorEmail: inquiry.businessEmail,
      company: inquiry.company,
      selectedService: inquiry.selectedService,
      companySize: inquiry.companySize,
      urgency: inquiry.urgency,
      preferredContactMethod: inquiry.preferredContactMethod,
      submissionId: inquiry.submissionId,
      contactId: crm.contactId,
      dealId: crm.dealId,
      submittedAt: inquiry.submittedAt,
      message: inquiry.message,
      requestId: context.requestId,
      notificationId: `${inquiry.submissionId}:staff`,
    });
    result.staffSent = true;
  } catch (error) {
    logger.warn("resend.email.failed", {
      ...base,
      status: "staff_failed",
      failureType: error instanceof ResendProviderError ? error.category : error instanceof Error ? error.name : "unknown",
      errorCode: "EMAIL_UNAVAILABLE",
      httpStatus: error instanceof ResendProviderError ? error.httpStatus : undefined,
      durationMs: elapsedMs(started),
    });
  }

  if (!result.visitorSent && !result.staffSent) {
    throw new EmailError(undefined, { alreadyLogged: true });
  }

  return result;
}
