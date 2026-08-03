import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { upsertInquiryInHubSpot } from "@/server/novatech/integrations/hubspot";
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
  turnstileToken: "token",
  submittedAt: "2026-07-31T00:00:00.000Z",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input, init) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        if (url.includes("/contacts/search")) {
          return json({ total: 0, results: [] });
        }
        if (url.endsWith("/contacts") && method === "POST") {
          return json({ id: "contact-1" });
        }
        if (url.endsWith("/deals") && method === "POST") {
          return json({ id: "deal-1" });
        }
        if (url.includes("/associations/deals/")) {
          return new Response(null, { status: 204 });
        }
        if (url.endsWith("/notes") && method === "POST") {
          return json({ id: "note-1" });
        }
        return json({ error: "unexpected" }, 500);
      },
    );

    const result = await upsertInquiryInHubSpot(inquiry, {
      requestId: "11111111-1111-4111-8111-111111111111",
      submissionId: inquiry.submissionId,
    });
    expect(result).toEqual({
      contactId: "contact-1",
      dealId: "deal-1",
      noteId: "note-1",
      contactCreated: true,
    });
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("updates an existing contact instead of creating a duplicate", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.includes("/contacts/search")) {
        return json({ total: 1, results: [{ id: "contact-9" }] });
      }
      if (url.includes("/contacts/contact-9") && method === "PATCH") {
        return json({ id: "contact-9" });
      }
      if (url.endsWith("/deals") && method === "POST") {
        return json({ id: "deal-2" });
      }
      if (url.includes("/associations/deals/")) {
        return new Response(null, { status: 204 });
      }
      if (url.endsWith("/notes")) {
        return json({ id: "note-2" });
      }
      return json({}, 500);
    });

    const result = await upsertInquiryInHubSpot(inquiry, {
      requestId: "11111111-1111-4111-8111-111111111111",
      submissionId: inquiry.submissionId,
    });
    expect(result.contactId).toBe("contact-9");
    expect(result.contactCreated).toBe(false);
    expect(result.dealId).toBe("deal-2");
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
