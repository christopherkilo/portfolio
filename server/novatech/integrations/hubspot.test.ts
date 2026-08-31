import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { upsertInquiryInHubSpot } from "@/server/novatech/integrations/hubspot";
import { DEAL_SUBMISSION_PROPERTY } from "@/server/novatech/integrations/hubspotClient";
import { HubSpotError } from "@/server/novatech/errors";
import type { NormalizedInquiry } from "@/server/novatech/mappers/inquiryMapper";

const inquiry: NormalizedInquiry = {
  name: "Alex Morgan",
  firstName: "Alex",
  lastName: "Morgan",
  businessEmail: "alex@example.com",
  phone: "555-0100",
  company: "Northwind",
  jobTitle: "Ops",
  selectedService: "cybersecurity",
  serviceLabel: "Cybersecurity",
  companySize: "11-50",
  companySizeLabel: "11–50 employees",
  currentEnvironment: "M365",
  urgency: "planning",
  urgencyLabel: "Planning / exploring",
  preferredContactMethod: "email",
  preferredContactLabel: "Email",
  message: "Need a security baseline for the team this quarter.",
  consent: true,
  submissionId: "11111111-1111-4111-8111-111111111111",
  submittedAt: "2026-07-31T00:00:00.000Z",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function crmFetch(options?: {
  contactSearch?: { total: number; results: Array<{ id: string }> };
  dealSearch?: { total: number; results: Array<{ id: string }> };
  notes?: Array<{ toObjectId: string }>;
  onDealCreate?: () => void;
}) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (url.includes(`/properties/deals/${DEAL_SUBMISSION_PROPERTY}`) && method === "GET") {
      return json({ name: DEAL_SUBMISSION_PROPERTY });
    }
    if (url.includes("/contacts/search")) {
      return json(options?.contactSearch ?? { total: 0, results: [] });
    }
    if (url.endsWith("/contacts") && method === "POST") {
      return json({ id: "contact-1" });
    }
    if (url.includes("/contacts/") && method === "PATCH") {
      return json({ id: "contact-9" });
    }
    if (url.includes("/deals/search")) {
      return json(options?.dealSearch ?? { total: 0, results: [] });
    }
    if (url.endsWith("/deals") && method === "POST") {
      options?.onDealCreate?.();
      return json({ id: "deal-1" });
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

describe("NovaTech HubSpot integration", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.HUBSPOT_ACCESS_TOKEN = "token";
    process.env.HUBSPOT_PIPELINE_ID = "default";
    process.env.HUBSPOT_DEAL_STAGE_ID = "appointmentscheduled";
    process.env.RESEND_API_KEY = "re_test";
    process.env.NOVATECH_FROM_EMAIL = "onboarding@resend.dev";
    process.env.NOVATECH_STAFF_EMAIL = "owner@example.com";
    process.env.TURNSTILE_SECRET_KEY = "ts";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  afterEach(() => {
    process.env = env;
    vi.restoreAllMocks();
  });

  it("creates a contact, deal, association, and note for new emails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(crmFetch());

    const result = await upsertInquiryInHubSpot(inquiry, {
      requestId: "11111111-1111-4111-8111-111111111111",
      submissionId: inquiry.submissionId,
    });
    expect(result).toMatchObject({
      contactId: "contact-1",
      dealId: "deal-1",
      noteId: "note-1",
      contactCreated: true,
      dealCreated: true,
      noteCreated: true,
    });
    expect(fetchSpy).toHaveBeenCalled();
    const dealCreate = fetchSpy.mock.calls.find(
      ([url, init]) => String(url).endsWith("/deals") && (init as RequestInit | undefined)?.method === "POST",
    );
    expect(String(dealCreate?.[1]?.body)).toContain(DEAL_SUBMISSION_PROPERTY);
    expect(String(dealCreate?.[1]?.body)).toContain(inquiry.submissionId);
  });

  it("updates an existing contact instead of creating a duplicate", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      crmFetch({
        contactSearch: { total: 1, results: [{ id: "contact-9" }] },
      }),
    );

    const result = await upsertInquiryInHubSpot(inquiry, {
      requestId: "11111111-1111-4111-8111-111111111111",
      submissionId: inquiry.submissionId,
    });
    expect(result.contactId).toBe("contact-9");
    expect(result.contactCreated).toBe(false);
    expect(result.dealId).toBe("deal-1");
  });

  it("does not create a second deal when recovering the same submissionId", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      crmFetch({
        dealSearch: { total: 1, results: [{ id: "deal-existing" }] },
        notes: [{ toObjectId: "note-existing" }],
      }),
    );

    const result = await upsertInquiryInHubSpot(inquiry, {
      requestId: "11111111-1111-4111-8111-111111111111",
      submissionId: inquiry.submissionId,
    });
    expect(result.dealId).toBe("deal-existing");
    expect(result.dealCreated).toBe(false);
    expect(result.noteId).toBe("note-existing");
    expect(result.noteCreated).toBe(false);
    const dealCreates = fetchSpy.mock.calls.filter(
      ([url, init]) => String(url).endsWith("/deals") && (init as RequestInit | undefined)?.method === "POST",
    );
    expect(dealCreates).toHaveLength(0);
  });

  it("maps auth failures to HubSpotError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json({}, 401));
    await expect(
      upsertInquiryInHubSpot(inquiry, {
        requestId: "11111111-1111-4111-8111-111111111111",
        submissionId: inquiry.submissionId,
      }),
    ).rejects.toBeInstanceOf(HubSpotError);
  });

  it("maps rate limits to HubSpotError after retries", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", {
        status: 429,
        headers: { "Retry-After": "0" },
      }),
    );
    await expect(
      upsertInquiryInHubSpot(inquiry, {
        requestId: "11111111-1111-4111-8111-111111111111",
        submissionId: inquiry.submissionId,
      }),
    ).rejects.toBeInstanceOf(HubSpotError);
  });
});
