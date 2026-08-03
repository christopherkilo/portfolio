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
  buildCrmNoteBody,
  buildDealName,
  type NormalizedInquiry,
} from "@/server/novatech/mappers/inquiryMapper";

const HUBSPOT_BASE = "https://api.hubapi.com";
const TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;

export type HubSpotInquiryResult = {
  contactId: string;
  dealId: string;
  noteId?: string;
  contactCreated: boolean;
};

export type HubSpotWorkflowContext = Pick<
  InquiryLogContext,
  "requestId" | "submissionId"
>;

type HubSpotFetchOptions = {
  method: string;
  path: string;
  body?: unknown;
  token: string;
  retrySafe?: boolean;
  context: HubSpotWorkflowContext;
};

async function hubspotFetch<T>({
  method,
  path,
  body,
  token,
  retrySafe = false,
  context,
}: HubSpotFetchOptions): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  const base = {
    requestId: context.requestId,
    submissionId: context.submissionId,
    integration: "hubspot" as const,
  };

  while (attempt <= MAX_RETRIES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${HUBSPOT_BASE}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        logger.warn("hubspot.request.failed", {
          ...base,
          status: "transient",
          httpStatus: response.status,
          attempt,
          errorCode: "CRM_UNAVAILABLE",
        });
        if (!retrySafe || attempt >= MAX_RETRIES) {
          throw new HubSpotError(undefined, {
            status: 503,
            alreadyLogged: true,
          });
        }
        const waitMs = Math.max(retryAfter * 1000, 400 * (attempt + 1));
        await new Promise((r) => setTimeout(r, waitMs));
        attempt += 1;
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        logger.error("hubspot.request.failed", {
          ...base,
          status: "auth_or_scope",
          httpStatus: response.status,
          errorCode: "CRM_UNAVAILABLE",
        });
        throw new HubSpotError(
          "We couldn’t submit your inquiry right now. Your entries have been preserved.",
          { status: 503, alreadyLogged: true },
        );
      }

      if (!response.ok) {
        logger.error("hubspot.request.failed", {
          ...base,
          status: "rejected",
          httpStatus: response.status,
          errorCode: "CRM_UNAVAILABLE",
        });
        throw new HubSpotError(undefined, {
          status: 502,
          alreadyLogged: true,
        });
      }

      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (error instanceof HubSpotError) throw error;
      logger.error("hubspot.request.failed", {
        ...base,
        status: "network",
        failureType: error instanceof Error ? error.name : "unknown",
        attempt,
        errorCode: "CRM_UNAVAILABLE",
      });
      if (!retrySafe || attempt >= MAX_RETRIES) {
        throw new HubSpotError(undefined, {
          status: 503,
          cause: error,
          alreadyLogged: true,
        });
      }
      attempt += 1;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new HubSpotError(undefined, {
    status: 503,
    cause: lastError,
    alreadyLogged: true,
  });
}

type SearchResult = {
  total?: number;
  results?: Array<{ id: string }>;
};

async function findContactByEmail(
  token: string,
  email: string,
  context: HubSpotWorkflowContext,
): Promise<string | null> {
  const data = await hubspotFetch<SearchResult>({
    method: "POST",
    path: "/crm/v3/objects/contacts/search",
    token,
    retrySafe: true,
    context,
    body: {
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: "EQ",
              value: email,
            },
          ],
        },
      ],
      properties: ["email"],
      limit: 1,
    },
  });
  return data.results?.[0]?.id ?? null;
}

function contactProperties(inquiry: NormalizedInquiry) {
  const props: Record<string, string> = {
    email: inquiry.businessEmail,
    firstname: inquiry.firstName,
    lastname: inquiry.lastName,
    company: inquiry.company,
  };
  if (inquiry.phone) props.phone = inquiry.phone;
  if (inquiry.jobTitle) props.jobtitle = inquiry.jobTitle;
  return props;
}

async function createContact(
  token: string,
  inquiry: NormalizedInquiry,
  context: HubSpotWorkflowContext,
): Promise<string> {
  const created = await hubspotFetch<{ id: string }>({
    method: "POST",
    path: "/crm/v3/objects/contacts",
    token,
    context,
    body: { properties: contactProperties(inquiry) },
  });
  return created.id;
}

async function updateContact(
  token: string,
  contactId: string,
  inquiry: NormalizedInquiry,
  context: HubSpotWorkflowContext,
): Promise<void> {
  await hubspotFetch({
    method: "PATCH",
    path: `/crm/v3/objects/contacts/${contactId}`,
    token,
    context,
    body: { properties: contactProperties(inquiry) },
  });
}

async function createDeal(
  token: string,
  inquiry: NormalizedInquiry,
  pipelineId: string,
  stageId: string,
  context: HubSpotWorkflowContext,
): Promise<string> {
  const created = await hubspotFetch<{ id: string }>({
    method: "POST",
    path: "/crm/v3/objects/deals",
    token,
    context,
    body: {
      properties: {
        dealname: buildDealName(inquiry),
        pipeline: pipelineId,
        dealstage: stageId,
      },
    },
  });
  return created.id;
}

const CONTACT_TO_DEAL = 4;
const NOTE_TO_CONTACT = 202;
const NOTE_TO_DEAL = 214;

async function associateContactAndDeal(
  token: string,
  contactId: string,
  dealId: string,
  context: HubSpotWorkflowContext,
): Promise<void> {
  await hubspotFetch({
    method: "PUT",
    path: `/crm/v4/objects/contacts/${contactId}/associations/deals/${dealId}`,
    token,
    context,
    body: [
      {
        associationCategory: "HUBSPOT_DEFINED",
        associationTypeId: CONTACT_TO_DEAL,
      },
    ],
  });
}

async function createInquiryNote(
  token: string,
  inquiry: NormalizedInquiry,
  contactId: string,
  dealId: string,
  context: HubSpotWorkflowContext,
): Promise<string | undefined> {
  try {
    const created = await hubspotFetch<{ id: string }>({
      method: "POST",
      path: "/crm/v3/objects/notes",
      token,
      context,
      body: {
        properties: {
          hs_note_body: buildCrmNoteBody(inquiry),
          hs_timestamp: Date.now().toString(),
        },
        associations: [
          {
            to: { id: contactId },
            types: [
              {
                associationCategory: "HUBSPOT_DEFINED",
                associationTypeId: NOTE_TO_CONTACT,
              },
            ],
          },
          {
            to: { id: dealId },
            types: [
              {
                associationCategory: "HUBSPOT_DEFINED",
                associationTypeId: NOTE_TO_DEAL,
              },
            ],
          },
        ],
      },
    });
    return created.id;
  } catch (error) {
    logger.warn("hubspot.request.failed", {
      requestId: context.requestId,
      submissionId: context.submissionId,
      integration: "hubspot",
      status: "note_failed",
      failureType: error instanceof Error ? error.name : "unknown",
      errorCode: "CRM_UNAVAILABLE",
    });
    return undefined;
  }
}

/**
 * Upsert contact by email, create deal + association + note.
 * Company objects are intentionally skipped in v1.
 */
export async function upsertInquiryInHubSpot(
  inquiry: NormalizedInquiry,
  context: HubSpotWorkflowContext,
): Promise<HubSpotInquiryResult> {
  const started = nowMs();
  const base = {
    requestId: context.requestId,
    submissionId: context.submissionId,
    integration: "hubspot" as const,
    selectedService: inquiry.selectedService,
    urgency: inquiry.urgency,
    phoneProvided: Boolean(inquiry.phone),
  };

  logger.info("hubspot.contact.upsert.started", base);

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

  try {
    const existingId = await findContactByEmail(
      env.hubspotAccessToken,
      inquiry.businessEmail,
      context,
    );

    let contactId: string;
    let contactCreated = false;
    if (existingId) {
      await updateContact(
        env.hubspotAccessToken,
        existingId,
        inquiry,
        context,
      );
      contactId = existingId;
    } else {
      contactId = await createContact(
        env.hubspotAccessToken,
        inquiry,
        context,
      );
      contactCreated = true;
    }

    logger.info("hubspot.contact.upsert.succeeded", {
      ...base,
      contactId,
      contactCreated,
      durationMs: elapsedMs(started),
    });

    const dealId = await createDeal(
      env.hubspotAccessToken,
      inquiry,
      env.hubspotPipelineId,
      env.hubspotDealStageId,
      context,
    );

    logger.info("hubspot.deal.create.succeeded", {
      ...base,
      contactId,
      dealId,
      durationMs: elapsedMs(started),
    });

    await associateContactAndDeal(
      env.hubspotAccessToken,
      contactId,
      dealId,
      context,
    );

    const noteId = await createInquiryNote(
      env.hubspotAccessToken,
      inquiry,
      contactId,
      dealId,
      context,
    );

    return { contactId, dealId, noteId, contactCreated };
  } catch (error) {
    if (error instanceof HubSpotError || error instanceof ConfigurationError) {
      throw error;
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
