import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendInquiryEmails } from "@/server/novatech/integrations/resend";
import {
  createResendClient,
  ResendProviderError,
} from "@/server/novatech/integrations/resendClient";
import { EmailError } from "@/server/novatech/errors";
import type { NormalizedInquiry } from "@/server/novatech/mappers/inquiryMapper";

const inquiry: NormalizedInquiry = {
  name: "Alex <script>Morgan</script>",
  firstName: "Alex",
  lastName: "<script>Morgan</script>",
  businessEmail: "alex@example.com",
  phone: "555-0100",
  company: "Northwind & Co",
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
  message: "<img src=x onerror=alert(1)> Need help",
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

describe("NovaTech Resend integration", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.HUBSPOT_ACCESS_TOKEN = "token";
    process.env.HUBSPOT_PIPELINE_ID = "default";
    process.env.HUBSPOT_DEAL_STAGE_ID = "stage";
    process.env.RESEND_API_KEY = "re_test";
    process.env.NOVATECH_FROM_EMAIL = "onboarding@resend.dev";
    process.env.NOVATECH_STAFF_EMAIL = "owner@example.com";
    process.env.TURNSTILE_SECRET_KEY = "ts";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  afterEach(() => {
    process.env = env;
    vi.unstubAllGlobals();
  });

  it("sends visitor and staff emails with escaped content and idempotency keys", async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { html?: string };
      expect(String(init?.headers)).toBeDefined();
      return json({ id: "email-1" });
    });
    vi.stubGlobal("fetch", fetchImpl);

    const result = await sendInquiryEmails(
      inquiry,
      { contactId: "c1", dealId: "d1", contactCreated: true, dealCreated: true, noteCreated: true },
      {
        requestId: "11111111-1111-4111-8111-111111111111",
        submissionId: inquiry.submissionId,
      },
    );

    expect(result).toEqual({ visitorSent: true, staffSent: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const visitorInit = fetchImpl.mock.calls[0][1] as RequestInit;
    const staffInit = fetchImpl.mock.calls[1][1] as RequestInit;
    const visitorHeaders = new Headers(visitorInit.headers);
    const staffHeaders = new Headers(staffInit.headers);
    expect(visitorHeaders.get("Idempotency-Key")).toBe(`${inquiry.submissionId}:customer`);
    expect(staffHeaders.get("Idempotency-Key")).toBe(`${inquiry.submissionId}:staff`);
    expect(visitorHeaders.get("Authorization")).toBe("Bearer re_test");

    const visitorBody = JSON.parse(String(visitorInit.body)) as { html: string; to: string[] };
    const staffBody = JSON.parse(String(staffInit.body)) as {
      html: string;
      reply_to: string;
    };
    expect(visitorBody.html).toContain("Cybersecurity");
    expect(visitorBody.html).not.toContain("<script>");
    expect(staffBody.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(staffBody.html).not.toContain("<img src=x");
    expect(staffBody.html).toContain("Northwind &amp; Co");
    expect(staffBody.reply_to).toBe("alex@example.com");
  });

  it("returns partial success when only one email fails", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ id: "v" }))
      .mockResolvedValueOnce(json({ message: "boom" }, 400));
    vi.stubGlobal("fetch", fetchImpl);

    const result = await sendInquiryEmails(
      inquiry,
      { contactId: "c1", dealId: "d1", contactCreated: true, dealCreated: true, noteCreated: true },
      {
        requestId: "11111111-1111-4111-8111-111111111111",
        submissionId: inquiry.submissionId,
      },
    );
    expect(result.visitorSent).toBe(true);
    expect(result.staffSent).toBe(false);
  });

  it("throws EmailError when both emails fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ message: "boom" }, 400)),
    );
    await expect(
      sendInquiryEmails(
        inquiry,
        { contactId: "c1", dealId: "d1", contactCreated: true, dealCreated: true, noteCreated: true },
        {
          requestId: "11111111-1111-4111-8111-111111111111",
          submissionId: inquiry.submissionId,
        },
      ),
    ).rejects.toBeInstanceOf(EmailError);
  });
});

describe("shared Resend client", () => {
  it("classifies 429 as transient", async () => {
    const fetchImpl = vi.fn(async () => json({}, 429));
    const client = createResendClient({
      apiKey: "re_test",
      fromEmail: "from@example.com",
      staffEmail: "staff@example.com",
      appUrl: "https://example.com",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(
      client.sendCustomerConfirmation({
        name: "Phase Two",
        selectedService: "managed-it",
        appUrl: "https://example.com",
        recipient: "phase@example.com",
        requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        submissionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        notificationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:customer",
      }),
    ).rejects.toMatchObject({ name: "ResendProviderError", retryable: true, httpStatus: 429 });
  });

  it("classifies 500 as transient", async () => {
    const client = createResendClient({
      apiKey: "re_test",
      fromEmail: "from@example.com",
      staffEmail: "staff@example.com",
      appUrl: "https://example.com",
      fetchImpl: (async () => json({}, 500)) as unknown as typeof fetch,
    });
    await expect(
      client.sendCustomerConfirmation({
        name: "Phase Two",
        selectedService: "managed-it",
        appUrl: "https://example.com",
        recipient: "phase@example.com",
        requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        submissionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        notificationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:customer",
      }),
    ).rejects.toMatchObject({ retryable: true, httpStatus: 500 });
  });

  it("classifies 401/403 as permanent auth failures", async () => {
    const client = createResendClient({
      apiKey: "re_test",
      fromEmail: "from@example.com",
      staffEmail: "staff@example.com",
      appUrl: "https://example.com",
      fetchImpl: (async () => json({}, 401)) as unknown as typeof fetch,
    });
    await expect(
      client.sendCustomerConfirmation({
        name: "Phase Two",
        selectedService: "managed-it",
        appUrl: "https://example.com",
        recipient: "phase@example.com",
        requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        submissionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        notificationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:customer",
      }),
    ).rejects.toMatchObject({ retryable: false, httpStatus: 401, category: "auth_or_scope" });
  });

  it("classifies 400 as permanent rejected", async () => {
    const client = createResendClient({
      apiKey: "re_test",
      fromEmail: "from@example.com",
      staffEmail: "staff@example.com",
      appUrl: "https://example.com",
      fetchImpl: (async () => json({}, 400)) as unknown as typeof fetch,
    });
    await expect(
      client.sendStaffNotification({
        name: "Phase Two",
        visitorEmail: "phase@example.com",
        company: "NovaTech",
        selectedService: "managed-it",
        companySize: "1-10",
        urgency: "planning",
        preferredContactMethod: "email",
        submissionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        contactId: "c1",
        dealId: "d1",
        requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        notificationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:staff",
      }),
    ).rejects.toMatchObject({ retryable: false, httpStatus: 400 });
  });

  it("classifies network timeout as transient", async () => {
    const client = createResendClient({
      apiKey: "re_test",
      fromEmail: "from@example.com",
      staffEmail: "staff@example.com",
      appUrl: "https://example.com",
      fetchImpl: (async () => {
        const error = new Error("The operation was aborted.");
        error.name = "AbortError";
        throw error;
      }) as unknown as typeof fetch,
    });
    await expect(
      client.sendCustomerConfirmation({
        name: "Phase Two",
        selectedService: "managed-it",
        appUrl: "https://example.com",
        recipient: "phase@example.com",
        requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        submissionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        notificationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:customer",
      }),
    ).rejects.toBeInstanceOf(ResendProviderError);
  });

  it("redacts API keys from error messages", () => {
    const error = new ResendProviderError("rejected", "Bearer re_live_secret failed");
    expect(error.message).not.toContain("re_live_secret");
    expect(error.message).toContain("[redacted]");
  });

  it("does not include email bodies in allowlisted logs", async () => {
    const events: Array<{ event: string; fields: Record<string, unknown> }> = [];
    const client = createResendClient({
      apiKey: "re_secret_key",
      fromEmail: "from@example.com",
      staffEmail: "staff@example.com",
      appUrl: "https://example.com",
      fetchImpl: (async () => json({ id: "ok" })) as unknown as typeof fetch,
      log: {
        info(event, fields) {
          events.push({ event, fields });
        },
        warn(event, fields) {
          events.push({ event, fields });
        },
        error(event, fields) {
          events.push({ event, fields });
        },
      },
    });
    await client.sendCustomerConfirmation({
      name: "Phase Two",
      selectedService: "managed-it",
      appUrl: "https://example.com",
      recipient: "secret.person@example.com",
      requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      submissionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      notificationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:customer",
    });
    const blob = JSON.stringify(events);
    expect(blob).not.toContain("secret.person@example.com");
    expect(blob).not.toContain("re_secret_key");
    expect(blob).not.toContain("<p>Hi");
    expect(blob).toContain("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });
});
