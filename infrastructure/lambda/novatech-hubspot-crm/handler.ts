import { WORKFLOW_TTL_SECONDS } from "../../lib/novatech-constants";
import {
  createHubSpotClient,
  HubSpotProviderError,
} from "../../../server/novatech/integrations/hubspotClient";
import { mapInquiryForBackend } from "../../../server/novatech/mappers/inquiryMapper";
import { PermanentFailure, TransientFailure } from "./errors";
import { logHubSpotEvent } from "./log";
import { getHubSpotAccessToken } from "./secrets";
import { parseWorkflowInput } from "./workflowInput";

export type HubSpotCrmOutput = {
  crmCreated: true;
  contactId: string;
  dealId: string;
  noteId: string;
  expiresAt: number;
};

function toStepFunctionsError(error: unknown): never {
  if (error instanceof TransientFailure || error instanceof PermanentFailure) {
    throw error;
  }
  if (error instanceof HubSpotProviderError) {
    if (error.retryable) {
      throw new TransientFailure();
    }
    throw new PermanentFailure();
  }
  throw new PermanentFailure();
}

export async function runHubSpotCrm(
  event: unknown,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<HubSpotCrmOutput> {
  const startedAt = Date.now();
  const input = parseWorkflowInput(event);
  const inquiry = mapInquiryForBackend({
    ...input.inquiry,
    submissionId: input.submissionId,
  });

  logHubSpotEvent("hubspot.workflow.started", {
    requestId: input.requestId,
    submissionId: input.submissionId,
    operation: "upsert_inquiry",
    selectedService: inquiry.selectedService,
    urgency: inquiry.urgency,
    phoneProvided: Boolean(inquiry.phone),
  });

  try {
    const token = await getHubSpotAccessToken();
    const client = createHubSpotClient({
      token,
      pipelineId: process.env.HUBSPOT_PIPELINE_ID || "default",
      stageId: process.env.HUBSPOT_DEAL_STAGE_ID || "appointmentscheduled",
      maxRetries: 0,
      noteFailure: "throw",
      log: {
        info: (eventName, fields) => logHubSpotEvent(eventName, fields),
        warn: (eventName, fields) => logHubSpotEvent(eventName, fields),
        error: (eventName, fields) => logHubSpotEvent(eventName, fields),
      },
    });

    const result = await client.upsertInquiryInHubSpot(inquiry, {
      requestId: input.requestId,
      submissionId: input.submissionId,
    });

    const output: HubSpotCrmOutput = {
      crmCreated: true,
      contactId: result.contactId,
      dealId: result.dealId,
      noteId: result.noteId ?? "",
      expiresAt: nowSeconds + WORKFLOW_TTL_SECONDS,
    };

    logHubSpotEvent("hubspot.workflow.succeeded", {
      requestId: input.requestId,
      submissionId: input.submissionId,
      operation: "upsert_inquiry",
      status: "ok",
      durationMs: Date.now() - startedAt,
      contactId: output.contactId,
      dealId: output.dealId,
      noteId: output.noteId || undefined,
      contactCreated: result.contactCreated,
      dealCreated: result.dealCreated,
      noteCreated: result.noteCreated,
    });

    return output;
  } catch (error) {
    logHubSpotEvent("hubspot.workflow.failed", {
      requestId: input.requestId,
      submissionId: input.submissionId,
      operation: "upsert_inquiry",
      status: error instanceof HubSpotProviderError ? error.category : "failed",
      durationMs: Date.now() - startedAt,
      httpStatus: error instanceof HubSpotProviderError ? error.httpStatus : undefined,
      failureType: error instanceof Error ? error.name : "unknown",
      errorCode: "CRM_UNAVAILABLE",
    });
    toStepFunctionsError(error);
  }
}

export async function handler(event: unknown): Promise<HubSpotCrmOutput> {
  return runHubSpotCrm(event);
}