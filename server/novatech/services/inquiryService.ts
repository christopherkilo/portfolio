import "server-only";

import { randomUUID } from "node:crypto";
import type { InquiryApiRequest } from "@/lib/demos/novatech/inquiry/schema";
import {
  assertFreshSubmissionId,
  releaseSubmissionId,
} from "@/server/novatech/duplicateGuard";
import { EnvMissingError } from "@/server/novatech/env";
import {
  ConfigurationError,
  DuplicateSubmissionError,
  EmailError,
  HubSpotError,
  NovatechError,
  UnexpectedInquiryError,
} from "@/server/novatech/errors";
import { upsertInquiryInHubSpot } from "@/server/novatech/integrations/hubspot";
import { sendInquiryEmails } from "@/server/novatech/integrations/resend";
import { verifyTurnstileToken } from "@/server/novatech/integrations/turnstile";
import {
  elapsedMs,
  emailDomainOnly,
  logger,
  nowMs,
} from "@/server/novatech/logger";
import { mapInquiryForBackend } from "@/server/novatech/mappers/inquiryMapper";

export type ProcessInquiryInput = {
  request: InquiryApiRequest;
  remoteIp?: string;
  /** HTTP request correlation id — distinct from submissionId. */
  requestId?: string;
};

export type ProcessInquiryResult = {
  inquiryId: string;
  emailSent: boolean;
  selectedService: InquiryApiRequest["selectedService"];
};

/**
 * Orchestrates Turnstile → HubSpot → Resend.
 *
 * Logging strategy:
 * - Integrations emit integration-specific events and mark typed errors as alreadyLogged.
 * - This service emits workflow events (completed / partial_success / failed).
 * - Route Handler logs only unexpected errors that have not already been logged.
 */
export async function processInquiry(
  input: ProcessInquiryInput,
): Promise<ProcessInquiryResult> {
  const requestId = input.requestId ?? randomUUID();
  const submissionId = input.request.submissionId;
  const workflowStarted = nowMs();

  const base = {
    requestId,
    submissionId,
    integration: "service" as const,
    selectedService: input.request.selectedService,
    urgency: input.request.urgency,
    phoneProvided: Boolean(input.request.phone?.trim()),
    emailDomain: emailDomainOnly(input.request.businessEmail),
  };

  assertFreshSubmissionId(submissionId);

  try {
    await verifyTurnstileToken({
      token: input.request.turnstileToken,
      remoteIp: input.remoteIp,
      context: { requestId, submissionId },
    });

    const inquiry = mapInquiryForBackend(input.request);

    let crm;
    try {
      crm = await upsertInquiryInHubSpot(inquiry, {
        requestId,
        submissionId,
      });
    } catch (error) {
      if (error instanceof NovatechError) throw error;
      if (error instanceof EnvMissingError) {
        logger.error("inquiry.failed", {
          ...base,
          integration: "config",
          errorCode: "CONFIGURATION_ERROR",
          status: "missing_env",
          durationMs: elapsedMs(workflowStarted),
        });
        throw new ConfigurationError(undefined, { alreadyLogged: true });
      }
      logger.error("inquiry.failed", {
        ...base,
        integration: "hubspot",
        errorCode: "CRM_UNAVAILABLE",
        status: "unexpected",
        failureType: error instanceof Error ? error.name : "unknown",
        durationMs: elapsedMs(workflowStarted),
      });
      throw new HubSpotError(undefined, {
        cause: error,
        alreadyLogged: true,
      });
    }

    let emailSent = false;
    try {
      const emails = await sendInquiryEmails(inquiry, crm, {
        requestId,
        submissionId,
      });
      emailSent = emails.visitorSent || emails.staffSent;
      if (!emails.visitorSent || !emails.staffSent) {
        logger.warn("inquiry.partial_success", {
          ...base,
          integration: "resend",
          status: "partial_email",
          visitorSent: emails.visitorSent,
          staffSent: emails.staffSent,
          dealId: crm.dealId,
          contactId: crm.contactId,
          durationMs: elapsedMs(workflowStarted),
        });
      }
    } catch (error) {
      logger.warn("inquiry.partial_success", {
        ...base,
        integration: "resend",
        status: "email_failed_after_crm",
        errorCode: "EMAIL_UNAVAILABLE",
        failureType:
          error instanceof EmailError
            ? "email_error"
            : error instanceof Error
              ? error.name
              : "unknown",
        dealId: crm.dealId,
        contactId: crm.contactId,
        durationMs: elapsedMs(workflowStarted),
      });
      emailSent = false;
    }

    logger.info(
      emailSent ? "inquiry.completed" : "inquiry.partial_success",
      {
        ...base,
        status: emailSent ? "ok" : "crm_ok_email_partial",
        dealId: crm.dealId,
        contactId: crm.contactId,
        contactCreated: crm.contactCreated,
        durationMs: elapsedMs(workflowStarted),
      },
    );

    return {
      inquiryId: crm.dealId,
      emailSent,
      selectedService: inquiry.selectedService,
    };
  } catch (error) {
    if (!(error instanceof DuplicateSubmissionError)) {
      releaseSubmissionId(submissionId);
    }

    if (error instanceof NovatechError) {
      if (!error.alreadyLogged) {
        logger.error("inquiry.failed", {
          ...base,
          errorCode: error.code,
          status: "failed",
          durationMs: elapsedMs(workflowStarted),
        });
        error.alreadyLogged = true;
      }
      throw error;
    }

    if (error instanceof EnvMissingError) {
      logger.error("inquiry.failed", {
        ...base,
        integration: "config",
        errorCode: "CONFIGURATION_ERROR",
        status: "missing_env",
        durationMs: elapsedMs(workflowStarted),
      });
      throw new ConfigurationError(undefined, { alreadyLogged: true });
    }

    logger.error("inquiry.failed", {
      ...base,
      errorCode: "INQUIRY_FAILED",
      status: "unexpected",
      failureType: error instanceof Error ? error.name : "unknown",
      durationMs: elapsedMs(workflowStarted),
      stack:
        process.env.NODE_ENV !== "production" && error instanceof Error
          ? error.stack
          : undefined,
    });
    throw new UnexpectedInquiryError(undefined, { alreadyLogged: true });
  }
}
