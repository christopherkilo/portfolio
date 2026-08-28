import "server-only";

import { randomUUID } from "node:crypto";
import type { InquiryApiRequest } from "@/lib/demos/novatech/inquiry/schema";
import type { InquirySchemaInput } from "@/lib/demos/novatech/inquiry/schema";
import { startNovaTechInquiryWorkflow } from "@/server/novatech/aws/startInquiryWorkflow";
import { EnvMissingError } from "@/server/novatech/env";
import {
  ConfigurationError,
  NovatechError,
  UnexpectedInquiryError,
} from "@/server/novatech/errors";
import { verifyTurnstileToken } from "@/server/novatech/integrations/turnstile";
import {
  elapsedMs,
  emailDomainOnly,
  logger,
  nowMs,
} from "@/server/novatech/logger";

export type ProcessInquiryInput = {
  request: InquiryApiRequest;
  remoteIp?: string;
  /** HTTP request correlation id — distinct from submissionId. */
  requestId?: string;
};

export type ProcessInquiryResult = {
  inquiryId: string;
  accepted: true;
  selectedService: InquiryApiRequest["selectedService"];
};

/**
 * Public ingress orchestration: Turnstile, then StartExecution.
 *
 * HubSpot, SQS, and Resend run asynchronously in AWS. DynamoDB is the
 * durable idempotency authority. This service does not wait for CRM or email.
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

  try {
    await verifyTurnstileToken({
      token: input.request.turnstileToken,
      remoteIp: input.remoteIp,
      context: { requestId, submissionId },
    });

    const inquiry = toWorkflowInquiry(input.request);

    let start;
    try {
      start = await startNovaTechInquiryWorkflow({
        submissionId,
        requestId,
        inquiry,
      });
    } catch (error) {
      if (error instanceof NovatechError) {
        if (!error.alreadyLogged) {
          logger.error("inquiry.workflow.start.failed", {
            ...base,
            integration: "stepfunctions",
            errorCode: error.code,
            status: "rejected",
            result: error.code === "CONFIGURATION_ERROR" ? "config" : "unavailable",
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
        integration: "stepfunctions",
        errorCode: "INQUIRY_FAILED",
        status: "unexpected",
        failureType: error instanceof Error ? error.name : "unknown",
        durationMs: elapsedMs(workflowStarted),
      });
      throw new UnexpectedInquiryError(undefined, { alreadyLogged: true });
    }

    logger.info("inquiry.accepted", {
      ...base,
      integration: "stepfunctions",
      status: "accepted",
      result: start.outcome,
      durationMs: elapsedMs(workflowStarted),
    });

    return {
      inquiryId: submissionId,
      accepted: true,
      selectedService: inquiry.selectedService,
    };
  } catch (error) {
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

function toWorkflowInquiry(request: InquiryApiRequest): InquirySchemaInput {
  return {
    name: request.name,
    businessEmail: request.businessEmail,
    phone: request.phone,
    company: request.company,
    jobTitle: request.jobTitle,
    selectedService: request.selectedService,
    companySize: request.companySize,
    currentEnvironment: request.currentEnvironment,
    urgency: request.urgency,
    preferredContactMethod: request.preferredContactMethod,
    message: request.message,
    consent: request.consent,
  };
}
