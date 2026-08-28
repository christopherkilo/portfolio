import {
  buildCrmNoteBody,
  buildDealName,
  type NormalizedInquiry,
} from "../mappers/inquiryMapper";

export const HUBSPOT_BASE = "https://api.hubapi.com";
export const HUBSPOT_TIMEOUT_MS = 12_000;
export const DEAL_SUBMISSION_PROPERTY = "novatech_submission_id";

const CONTACT_TO_DEAL = 4;
const NOTE_TO_CONTACT = 202;
const NOTE_TO_DEAL = 214;

export type HubSpotInquiryResult = {
  contactId: string;
  dealId: string;
  noteId?: string;
  contactCreated: boolean;
  dealCreated: boolean;
  noteCreated: boolean;
};

export type HubSpotWorkflowContext = {
  requestId: string;
  submissionId: string;
};

export type HubSpotErrorCategory =
  | "transient"
  | "auth_or_scope"
  | "rejected"
  | "network"
  | "invalid_input";

export type HubSpotLogFields = {
  requestId: string;
  submissionId: string;
  integration: "hubspot";
  status?: string;
  httpStatus?: number;
  attempt?: number;
  errorCode?: string;
  durationMs?: number;
  contactId?: string;
  dealId?: string;
  noteId?: string;
  contactCreated?: boolean;
  selectedService?: string;
  urgency?: string;
  phoneProvided?: boolean;
  failureType?: string;
  operation?: string;
};

export type HubSpotLogger = {
  info(event: string, fields: HubSpotLogFields): void;
  warn(event: string, fields: HubSpotLogFields): void;
  error(event: string, fields: HubSpotLogFields): void;
};

export class HubSpotProviderError extends Error {
  readonly name = "HubSpotProviderError";
  readonly retryable: boolean;
  readonly category: HubSpotErrorCategory;
  readonly httpStatus?: number;

  constructor(
    category: HubSpotErrorCategory,
    message: string,
    options: { retryable: boolean; httpStatus?: number; cause?: unknown } = {
      retryable: false,
    },
  ) {
    super(redactSecrets(message), { cause: options.cause });
    this.category = category;
    this.retryable = options.retryable;
    this.httpStatus = options.httpStatus;
  }
}

export type HubSpotClientConfig = {
  token: string;
  pipelineId: string;
  stageId: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  /** In-process retries after the first attempt. Next.js uses 2; Lambda uses 0 so Step Functions retries. */
  maxRetries?: number;
  /** When a note fails after contact+deal, ignore (Next.js) or throw (AWS retry-safe completion). */
  noteFailure?: "ignore" | "throw";
  log?: HubSpotLogger;
  nowMs?: () => number;
};

type HubSpotFetchOptions = {
  method: string;
  path: string;
  body?: unknown;
  retrySafe?: boolean;
};

function redactSecrets(value: string): string {
  return value
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/pat-[a-z0-9-]+/gi, "[redacted]");
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultNow(): number {
  return Date.now();
}

const silentLog: HubSpotLogger = {
  info() {},
  warn() {},
  error() {},
};

export function createHubSpotClient(config: HubSpotClientConfig) {
  const fetchImpl = config.fetchImpl ?? fetch;
  const sleep = config.sleep ?? defaultSleep;
  const maxRetries = config.maxRetries ?? 2;
  const log = config.log ?? silentLog;
  const nowMs = config.nowMs ?? defaultNow;
  const noteFailure = config.noteFailure ?? "ignore";
  let submissionPropertyReady = false;

  async function hubspotFetch<T>({
    method,
    path,
    body,
    retrySafe = false,
    context,
  }: HubSpotFetchOptions & { context: HubSpotWorkflowContext }): Promise<T> {
    let attempt = 0;
    let lastError: unknown;
    const base: HubSpotLogFields = {
      requestId: context.requestId,
      submissionId: context.submissionId,
      integration: "hubspot",
    };

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HUBSPOT_TIMEOUT_MS);
      try {
        const response = await fetchImpl(`${HUBSPOT_BASE}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });

        if (response.status === 429 || response.status >= 500) {
          log.warn("hubspot.request.failed", {
            ...base,
            status: "transient",
            httpStatus: response.status,
            attempt,
            errorCode: "CRM_UNAVAILABLE",
          });
          const retryable = retrySafe && attempt < maxRetries;
          if (!retryable) {
            throw new HubSpotProviderError("transient", "HubSpot was temporarily unavailable.", {
              retryable: true,
              httpStatus: response.status,
            });
          }
          const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
          await sleep(Math.max(retryAfter * 1000, 400 * (attempt + 1)));
          attempt += 1;
          continue;
        }

        if (response.status === 401 || response.status === 403) {
          log.error("hubspot.request.failed", {
            ...base,
            status: "auth_or_scope",
            httpStatus: response.status,
            errorCode: "CRM_UNAVAILABLE",
          });
          throw new HubSpotProviderError(
            "auth_or_scope",
            "HubSpot authentication or scopes were rejected.",
            { retryable: false, httpStatus: response.status },
          );
        }

        if (response.status === 404) {
          throw new HubSpotProviderError("rejected", "HubSpot resource was not found.", {
            retryable: false,
            httpStatus: 404,
          });
        }

        if (!response.ok) {
          log.error("hubspot.request.failed", {
            ...base,
            status: "rejected",
            httpStatus: response.status,
            errorCode: "CRM_UNAVAILABLE",
          });
          throw new HubSpotProviderError("rejected", "HubSpot rejected the CRM request.", {
            retryable: false,
            httpStatus: response.status,
          });
        }

        if (response.status === 204) return undefined as T;
        return (await response.json()) as T;
      } catch (error) {
        lastError = error;
        if (error instanceof HubSpotProviderError) throw error;
        log.error("hubspot.request.failed", {
          ...base,
          status: "network",
          failureType: error instanceof Error ? error.name : "unknown",
          attempt,
          errorCode: "CRM_UNAVAILABLE",
        });
        const retryable = retrySafe && attempt < maxRetries;
        if (!retryable) {
          throw new HubSpotProviderError("network", "HubSpot request failed due to a network error.", {
            retryable: true,
            cause: error,
          });
        }
        attempt += 1;
      } finally {
        clearTimeout(timer);
      }
    }

    throw new HubSpotProviderError("network", "HubSpot request failed after bounded retries.", {
      retryable: true,
      cause: lastError,
    });
  }

  async function ensureDealSubmissionProperty(context: HubSpotWorkflowContext): Promise<void> {
    if (submissionPropertyReady) return;
    try {
      await hubspotFetch({
        method: "GET",
        path: `/crm/v3/properties/deals/${DEAL_SUBMISSION_PROPERTY}`,
        retrySafe: true,
        context,
      });
      submissionPropertyReady = true;
      return;
    } catch (error) {
      if (!(error instanceof HubSpotProviderError) || error.httpStatus !== 404) {
        throw error;
      }
    }

    const body = {
      name: DEAL_SUBMISSION_PROPERTY,
      label: "NovaTech Submission ID",
      type: "string",
      fieldType: "text",
      groupName: "dealinformation",
      hasUniqueValue: true,
      description: "Durable NovaTech inquiry submissionId used to avoid duplicate deals on retry.",
    };

    try {
      await hubspotFetch({
        method: "POST",
        path: "/crm/v3/properties/deals",
        context,
        body,
      });
    } catch (error) {
      if (error instanceof HubSpotProviderError && error.httpStatus === 400) {
        await hubspotFetch({
          method: "POST",
          path: "/crm/v3/properties/deals",
          context,
          body: { ...body, hasUniqueValue: false },
        });
      } else {
        throw error;
      }
    }
    submissionPropertyReady = true;
  }

  async function findContactByEmail(
    email: string,
    context: HubSpotWorkflowContext,
  ): Promise<string | null> {
    const data = await hubspotFetch<{ results?: Array<{ id: string }> }>({
      method: "POST",
      path: "/crm/v3/objects/contacts/search",
      retrySafe: true,
      context,
      body: {
        filterGroups: [
          {
            filters: [{ propertyName: "email", operator: "EQ", value: email }],
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

  async function findDealBySubmissionId(
    submissionId: string,
    context: HubSpotWorkflowContext,
  ): Promise<string | null> {
    const data = await hubspotFetch<{ results?: Array<{ id: string }> }>({
      method: "POST",
      path: "/crm/v3/objects/deals/search",
      retrySafe: true,
      context,
      body: {
        filterGroups: [
          {
            filters: [
              {
                propertyName: DEAL_SUBMISSION_PROPERTY,
                operator: "EQ",
                value: submissionId,
              },
            ],
          },
        ],
        properties: [DEAL_SUBMISSION_PROPERTY, "dealname"],
        limit: 1,
      },
    });
    return data.results?.[0]?.id ?? null;
  }

  async function listDealNoteIds(
    dealId: string,
    context: HubSpotWorkflowContext,
  ): Promise<string[]> {
    const data = await hubspotFetch<{ results?: Array<{ id?: string; toObjectId?: string }> }>({
      method: "GET",
      path: `/crm/v4/objects/deals/${dealId}/associations/notes`,
      retrySafe: true,
      context,
    });
    return (data.results ?? [])
      .map((row) => row.id ?? row.toObjectId)
      .filter((id): id is string => Boolean(id));
  }

  async function upsertInquiryInHubSpot(
    inquiry: NormalizedInquiry,
    context: HubSpotWorkflowContext,
  ): Promise<HubSpotInquiryResult> {
    const started = nowMs();
    const base: HubSpotLogFields = {
      requestId: context.requestId,
      submissionId: context.submissionId,
      integration: "hubspot",
      selectedService: inquiry.selectedService,
      urgency: inquiry.urgency,
      phoneProvided: Boolean(inquiry.phone),
    };

    log.info("hubspot.contact.upsert.started", base);
    await ensureDealSubmissionProperty(context);

    const existingId = await findContactByEmail(inquiry.businessEmail, context);
    let contactId: string;
    let contactCreated = false;
    if (existingId) {
      await hubspotFetch({
        method: "PATCH",
        path: `/crm/v3/objects/contacts/${existingId}`,
        context,
        body: { properties: contactProperties(inquiry) },
      });
      contactId = existingId;
    } else {
      const created = await hubspotFetch<{ id: string }>({
        method: "POST",
        path: "/crm/v3/objects/contacts",
        context,
        body: { properties: contactProperties(inquiry) },
      });
      contactId = created.id;
      contactCreated = true;
    }

    log.info("hubspot.contact.upsert.succeeded", {
      ...base,
      contactId,
      contactCreated,
      durationMs: Math.round(nowMs() - started),
    });

    let dealId = await findDealBySubmissionId(inquiry.submissionId, context);
    let dealCreated = false;
    if (!dealId) {
      const created = await hubspotFetch<{ id: string }>({
        method: "POST",
        path: "/crm/v3/objects/deals",
        context,
        body: {
          properties: {
            dealname: buildDealName(inquiry),
            pipeline: config.pipelineId,
            dealstage: config.stageId,
            [DEAL_SUBMISSION_PROPERTY]: inquiry.submissionId,
          },
        },
      });
      dealId = created.id;
      dealCreated = true;
    }

    log.info("hubspot.deal.create.succeeded", {
      ...base,
      contactId,
      dealId,
      durationMs: Math.round(nowMs() - started),
      status: dealCreated ? "created" : "recovered",
    });

    await hubspotFetch({
      method: "PUT",
      path: `/crm/v4/objects/contacts/${contactId}/associations/deals/${dealId}`,
      context,
      body: [
        {
          associationCategory: "HUBSPOT_DEFINED",
          associationTypeId: CONTACT_TO_DEAL,
        },
      ],
    });

    const existingNotes = await listDealNoteIds(dealId, context);
    if (existingNotes.length > 0) {
      return {
        contactId,
        dealId,
        noteId: existingNotes[0],
        contactCreated,
        dealCreated,
        noteCreated: false,
      };
    }

    try {
      const created = await hubspotFetch<{ id: string }>({
        method: "POST",
        path: "/crm/v3/objects/notes",
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
      return {
        contactId,
        dealId,
        noteId: created.id,
        contactCreated,
        dealCreated,
        noteCreated: true,
      };
    } catch (error) {
      log.warn("hubspot.request.failed", {
        ...base,
        status: "note_failed",
        contactId,
        dealId,
        failureType: error instanceof Error ? error.name : "unknown",
        errorCode: "CRM_UNAVAILABLE",
      });
      if (noteFailure === "throw") {
        throw error;
      }
      return {
        contactId,
        dealId,
        contactCreated,
        dealCreated,
        noteCreated: false,
      };
    }
  }

  return {
    upsertInquiryInHubSpot,
    findDealBySubmissionId,
    ensureDealSubmissionProperty,
  };
}