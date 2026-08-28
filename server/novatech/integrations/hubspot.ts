/**
 * Next.js HubSpot wrapper used by unit tests of the shared CRM client.
 * Production public inquiries do not call this module — AWS HubSpot Lambda does.
 */
import "server-only";

import { getNovatechServerEnv } from "@/server/novatech/env";
import {
  ConfigurationError,
  HubSpotError,
} from "@/server/novatech/errors";
import {
  elapsedMs,
  logger,
  nowMs,
  type InquiryLogContext,
} from "@/server/novatech/logger";
import {
  createHubSpotClient,
  HubSpotProviderError,
  type HubSpotInquiryResult,
  type HubSpotWorkflowContext,
} from "@/server/novatech/integrations/hubspotClient";
import type { NormalizedInquiry } from "@/server/novatech/mappers/inquiryMapper";

export type { HubSpotInquiryResult, HubSpotWorkflowContext };

/**
 * Upsert contact by email, create (or recover) deal + association + note.
 * Company objects are intentionally skipped in v1.
 */
export async function upsertInquiryInHubSpot(
  inquiry: NormalizedInquiry,
  context: HubSpotWorkflowContext,
): Promise<HubSpotInquiryResult> {
  const started = nowMs();
  const base: InquiryLogContext = {
    requestId: context.requestId,
    submissionId: context.submissionId,
    integration: "hubspot",
    selectedService: inquiry.selectedService,
    urgency: inquiry.urgency,
    phoneProvided: Boolean(inquiry.phone),
  };

  let env;
  try {
    env = getNovatechServerEnv();
  } catch {
    logger.error("hubspot.request.failed", {
      ...base,
      status: "missing_env",
      errorCode: "CONFIGURATION_ERROR",
      durationMs: elapsedMs(started),
    });
    throw new ConfigurationError(undefined, { alreadyLogged: true });
  }

  const client = createHubSpotClient({
    token: env.hubspotAccessToken,
    pipelineId: env.hubspotPipelineId,
    stageId: env.hubspotDealStageId,
    maxRetries: 2,
    noteFailure: "ignore",
    log: logger,
    nowMs,
  });

  try {
    return await client.upsertInquiryInHubSpot(inquiry, context);
  } catch (error) {
    if (error instanceof HubSpotError || error instanceof ConfigurationError) {
      throw error;
    }
    if (error instanceof HubSpotProviderError) {
      throw new HubSpotError(undefined, {
        status: error.retryable ? 503 : error.httpStatus === 401 || error.httpStatus === 403 ? 503 : 502,
        cause: error,
        alreadyLogged: true,
      });
    }
    logger.error("hubspot.request.failed", {
      ...base,
      status: "unexpected",
      errorCode: "CRM_UNAVAILABLE",
      failureType: error instanceof Error ? error.name : "unknown",
      durationMs: elapsedMs(started),
    });
    throw new HubSpotError(undefined, {
      cause: error,
      alreadyLogged: true,
    });
  }
}