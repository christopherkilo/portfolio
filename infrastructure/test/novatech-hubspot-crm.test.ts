import {
  createHubSpotClient,
  DEAL_SUBMISSION_PROPERTY,
  HubSpotProviderError,
} from "../../server/novatech/integrations/hubspotClient";
import { mapInquiryForBackend } from "../../server/novatech/mappers/inquiryMapper";
import { PermanentFailure, TransientFailure } from "../lambda/novatech-hubspot-crm/errors";
import { runHubSpotCrm } from "../lambda/novatech-hubspot-crm/handler";
import { sanitizeHubSpotLog } from "../lambda/novatech-hubspot-crm/log";
import { parseWorkflowInput } from "../lambda/novatech-hubspot-crm/workflowInput";
import { clearHubSpotTokenCache } from "../lambda/novatech-hubspot-crm/secrets";

jest.mock("../lambda/novatech-hubspot-crm/secrets", () => ({
  getHubSpotAccessToken: jest.fn(async () => "test-token"),
  clearHubSpotTokenCache: jest.fn(),
}));

const inquiryBody = {
  name: "Phase Two",
  businessEmail: "phase2.verify@example.com",
  phone: "",
  company: "NovaTech Phase Two Test",
  jobTitle: "",
  selectedService: "managed-it" as const,
  companySize: "1-10" as const,
  currentEnvironment: "Synthetic AWS verification",
  urgency: "planning" as const,
  preferredContactMethod: "email" as const,
  message: "Synthetic Phase 2 HubSpot verification.",
  consent: true as const,
};

const workflowEvent = {
  submissionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  inquiry: inquiryBody,
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function crmFetch(options?: {
  dealId?: string;
  notes?: Array<{ toObjectId: string }>;
  dealSearchResults?: Array<{ id: string }>;
  fail?: { status: number; path?: string };
  abort?: boolean;
}) {
  return async (input: string | URL | Request, init?: RequestInit) => {
    if (options?.abort) {
      const error = new Error("The operation was aborted.");
      error.name = "AbortError";
      throw error;
    }
    const url = String(input);
    const method = init?.method ?? "GET";
    if (options?.fail && (!options.fail.path || url.includes(options.fail.path))) {
      return json({}, options.fail.status);
    }
    if (url.includes(`/properties/deals/${DEAL_SUBMISSION_PROPERTY}`) && method === "GET") {
      return json({ name: DEAL_SUBMISSION_PROPERTY });
    }
    if (url.includes("/contacts/search")) {
      return json({ total: 0, results: [] });
    }
    if (url.endsWith("/contacts") && method === "POST") {
      return json({ id: "contact-1" });
    }
    if (url.includes("/deals/search")) {
      return json({
        total: options?.dealSearchResults?.length ?? 0,
        results: options?.dealSearchResults ?? [],
      });
    }
    if (url.endsWith("/deals") && method === "POST") {
      return json({ id: options?.dealId ?? "deal-1" });
    }
    if (url.includes("/associations/deals/")) {
      return new Response(null, { status: 204 });
    }
    if (url.includes("/associations/notes")) {
      return json({ results: options?.notes ?? [] });
    }
    if (url.endsWith("/notes") && method === "POST") {
      return json({ id: "note-1" });
    }
    return json({ error: "unexpected" }, 500);
  };
}

describe("workflow input contract", () => {
  it("accepts the authoritative NovaTech inquiry schema", () => {
    const parsed = parseWorkflowInput(workflowEvent);
    expect(parsed.inquiry.businessEmail).toBe("phase2.verify@example.com");
    expect(parsed.inquiry.selectedService).toBe("managed-it");
  });

  it("rejects malformed payloads before CRM writes", () => {
    expect(() => parseWorkflowInput({ submissionId: "nope" })).toThrow(PermanentFailure);
    expect(() =>
      parseWorkflowInput({
        ...workflowEvent,
        inquiry: { ...inquiryBody, message: "too short" },
      }),
    ).toThrow(PermanentFailure);
  });
});

describe("inquiry mapping", () => {
  it("maps workflow inquiry fields the same way as the Next.js backend", () => {
    const mapped = mapInquiryForBackend({
      ...inquiryBody,
      submissionId: workflowEvent.submissionId,
    });
    expect(mapped.firstName).toBe("Phase");
    expect(mapped.lastName).toBe("Two");
    expect(mapped.businessEmail).toBe("phase2.verify@example.com");
    expect(mapped.serviceLabel).toBe("Managed IT");
    expect(mapped).not.toHaveProperty("turnstileToken");
  });
});

describe("HubSpot CRM client", () => {
  const context = {
    requestId: workflowEvent.requestId,
    submissionId: workflowEvent.submissionId,
  };

  function client(fetchImpl: typeof fetch) {
    return createHubSpotClient({
      token: "secret-token",
      pipelineId: "default",
      stageId: "appointmentscheduled",
      fetchImpl,
      maxRetries: 0,
      noteFailure: "throw",
      sleep: async () => undefined,
    });
  }

  it("creates contact, deal, association, and note", async () => {
    const result = await client(crmFetch()).upsertInquiryInHubSpot(
      mapInquiryForBackend({ ...inquiryBody, submissionId: context.submissionId }),
      context,
    );
    expect(result).toMatchObject({
      contactId: "contact-1",
      dealId: "deal-1",
      noteId: "note-1",
      contactCreated: true,
      dealCreated: true,
    });
  });

  it("does not create another deal when the submissionId already exists", async () => {
    const fetchImpl = jest.fn(
      crmFetch({
        dealSearchResults: [{ id: "deal-existing" }],
        notes: [{ toObjectId: "note-existing" }],
      }),
    );
    const result = await client(fetchImpl as unknown as typeof fetch).upsertInquiryInHubSpot(
      mapInquiryForBackend({ ...inquiryBody, submissionId: context.submissionId }),
      context,
    );
    expect(result.dealId).toBe("deal-existing");
    expect(result.dealCreated).toBe(false);
    expect(
      fetchImpl.mock.calls.filter(
        ([url, init]) => String(url).endsWith("/deals") && (init as RequestInit | undefined)?.method === "POST",
      ),
    ).toHaveLength(0);
  });

  it("classifies 429 and 500 as retryable", async () => {
    await expect(
      client(crmFetch({ fail: { status: 429 } })).upsertInquiryInHubSpot(
        mapInquiryForBackend({ ...inquiryBody, submissionId: context.submissionId }),
        context,
      ),
    ).rejects.toMatchObject({ retryable: true, httpStatus: 429 });

    await expect(
      client(crmFetch({ fail: { status: 500 } })).upsertInquiryInHubSpot(
        mapInquiryForBackend({ ...inquiryBody, submissionId: context.submissionId }),
        context,
      ),
    ).rejects.toMatchObject({ retryable: true, httpStatus: 500 });
  });

  it("classifies 400, 401, and 403 as permanent", async () => {
    for (const status of [400, 401, 403]) {
      await expect(
        client(crmFetch({ fail: { status } })).upsertInquiryInHubSpot(
          mapInquiryForBackend({ ...inquiryBody, submissionId: context.submissionId }),
          context,
        ),
      ).rejects.toMatchObject({ retryable: false, httpStatus: status });
    }
  });

  it("retries a failed note without creating a second deal", async () => {
    let dealPosts = 0;
    let noteAttempts = 0;
    const fetchImpl = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.includes(`/properties/deals/${DEAL_SUBMISSION_PROPERTY}`) && method === "GET") {
        return json({ name: DEAL_SUBMISSION_PROPERTY });
      }
      if (url.includes("/contacts/search")) return json({ total: 0, results: [] });
      if (url.endsWith("/contacts") && method === "POST") return json({ id: "contact-1" });
      if (url.includes("/deals/search")) {
        return json({
          total: dealPosts,
          results: dealPosts ? [{ id: "deal-1" }] : [],
        });
      }
      if (url.endsWith("/deals") && method === "POST") {
        dealPosts += 1;
        return json({ id: "deal-1" });
      }
      if (url.includes("/associations/deals/")) return new Response(null, { status: 204 });
      if (url.includes("/associations/notes")) return json({ results: [] });
      if (url.endsWith("/notes") && method === "POST") {
        noteAttempts += 1;
        if (noteAttempts === 1) return json({}, 500);
        return json({ id: "note-1" });
      }
      return json({}, 500);
    });

    const mapped = mapInquiryForBackend({
      ...inquiryBody,
      submissionId: context.submissionId,
    });
    const crm = client(fetchImpl as unknown as typeof fetch);
    await expect(crm.upsertInquiryInHubSpot(mapped, context)).rejects.toMatchObject({
      retryable: true,
      httpStatus: 500,
    });
    const recovered = await crm.upsertInquiryInHubSpot(mapped, context);
    expect(dealPosts).toBe(1);
    expect(recovered.dealId).toBe("deal-1");
    expect(recovered.noteId).toBe("note-1");
    expect(recovered.dealCreated).toBe(false);
  });

  it("classifies network timeouts as retryable without leaking the token", async () => {
    try {
      await client(crmFetch({ abort: true })).upsertInquiryInHubSpot(
        mapInquiryForBackend({ ...inquiryBody, submissionId: context.submissionId }),
        context,
      );
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(HubSpotProviderError);
      expect((error as HubSpotProviderError).retryable).toBe(true);
      expect(String((error as Error).message)).not.toContain("secret-token");
      expect(String((error as Error).message)).not.toMatch(/Bearer /i);
    }
  });
});

describe("HubSpot CRM Lambda handler", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    clearHubSpotTokenCache();
  });

  it("returns only safe CRM identifiers", async () => {
    jest.spyOn(globalThis, "fetch").mockImplementation(crmFetch());
    const result = await runHubSpotCrm(workflowEvent, 1_700_000_000);
    expect(result).toEqual({
      crmCreated: true,
      contactId: "contact-1",
      dealId: "deal-1",
      noteId: "note-1",
      expiresAt: 1_700_000_000 + 14 * 24 * 60 * 60,
    });
    expect(JSON.stringify(result)).not.toContain("phase2.verify");
    expect(JSON.stringify(result)).not.toContain("Synthetic Phase 2");
  });

  it("maps transient HubSpot errors to TransientFailure", async () => {
    jest.spyOn(globalThis, "fetch").mockImplementation(crmFetch({ fail: { status: 429 } }));
    await expect(runHubSpotCrm(workflowEvent)).rejects.toBeInstanceOf(TransientFailure);
  });

  it("maps auth failures to PermanentFailure without retry", async () => {
    jest.spyOn(globalThis, "fetch").mockImplementation(crmFetch({ fail: { status: 401 } }));
    await expect(runHubSpotCrm(workflowEvent)).rejects.toBeInstanceOf(PermanentFailure);
  });

  it("does not log email, message, or bearer tokens", async () => {
    const lines: string[] = [];
    const original = console.log;
    console.log = (value: unknown) => {
      lines.push(String(value));
    };
    jest.spyOn(globalThis, "fetch").mockImplementation(crmFetch());
    try {
      await runHubSpotCrm({
        ...workflowEvent,
        inquiry: {
          ...inquiryBody,
          businessEmail: "should-not-log@example.com",
          message: "Do not log this inquiry message body.",
        },
      });
    } finally {
      console.log = original;
    }
    const blob = lines.join("\n");
    expect(blob).toContain(workflowEvent.submissionId);
    expect(blob).not.toContain("should-not-log");
    expect(blob).not.toContain("Do not log this");
    expect(blob).not.toContain("test-token");
    expect(blob).not.toMatch(/Bearer /i);
  });
});

describe("sanitized logging", () => {
  it("redacts secrets and drops unsafe keys", () => {
    const sanitized = sanitizeHubSpotLog({
      event: "hubspot.workflow.started",
      submissionId: "sub-1",
      email: "person@example.com",
      message: "secret message",
      status: "Bearer pat-123-should-redact",
    });
    expect(sanitized.email).toBeUndefined();
    expect(sanitized.message).toBeUndefined();
    expect(sanitized.status).toBe("[redacted]");
    expect(sanitized.submissionId).toBe("sub-1");
  });
});
