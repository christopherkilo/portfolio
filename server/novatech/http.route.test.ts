import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetInquiryRateLimitForTests } from "@/server/novatech/rateLimit";
import { __resetDuplicateGuardForTests } from "@/server/novatech/duplicateGuard";

vi.mock("@/server/novatech/services/inquiryService", () => ({
  processInquiry: vi.fn(),
}));

import { POST } from "@/app/api/novatech/inquiries/route";
import { processInquiry } from "@/server/novatech/services/inquiryService";

const validBody = {
  name: "Alex Morgan",
  businessEmail: "alex@example.com",
  phone: "",
  company: "Northwind",
  jobTitle: "",
  selectedService: "cybersecurity",
  companySize: "11-50",
  currentEnvironment: "",
  urgency: "planning",
  preferredContactMethod: "email",
  message: "We need a practical security baseline for a growing team.",
  consent: true,
  turnstileToken: "token",
  submissionId: "11111111-1111-4111-8111-111111111111",
};

function request(
  body: unknown,
  init?: { contentType?: string | null; ip?: string },
) {
  const headers = new Headers();
  if (init?.contentType !== null) {
    headers.set("Content-Type", init?.contentType ?? "application/json");
  }
  if (init?.ip) headers.set("x-forwarded-for", init.ip);
  return new Request("http://localhost/api/novatech/inquiries", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/novatech/inquiries", () => {
  beforeEach(() => {
    __resetInquiryRateLimitForTests();
    __resetDuplicateGuardForTests();
    vi.mocked(processInquiry).mockReset();
  });

  afterEach(() => {
    __resetInquiryRateLimitForTests();
    __resetDuplicateGuardForTests();
  });

  it("rejects unsupported Content-Type", async () => {
    const response = await POST(
      request(validBody, { contentType: "text/plain" }),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_JSON");
    expect(json.error.requestId).toBe(response.headers.get("x-request-id"));
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(request("{", { contentType: "application/json" }));
    expect(response.status).toBe(400);
  });

  it("returns 422 for validation errors", async () => {
    const response = await POST(
      request({ ...validBody, businessEmail: "nope" }),
    );
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fieldErrors.businessEmail).toBeTruthy();
    expect(processInquiry).not.toHaveBeenCalled();
  });

  it("returns 403 when the service reports Turnstile failure", async () => {
    const { TurnstileError } = await import("@/server/novatech/errors");
    vi.mocked(processInquiry).mockRejectedValue(
      new TurnstileError("TURNSTILE_FAILED"),
    );
    const response = await POST(request(validBody));
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("TURNSTILE_FAILED");
  });

  it("returns 429 when rate limited", async () => {
    for (let i = 0; i < 5; i += 1) {
      vi.mocked(processInquiry).mockResolvedValue({
        inquiryId: `d-${i}`,
        emailSent: true,
        selectedService: "cybersecurity",
      });
      const ok = await POST(
        request(
          {
            ...validBody,
            submissionId: `11111111-1111-4111-8111-11111111111${i}`,
          },
          { ip: "9.9.9.9" },
        ),
      );
      expect(ok.status).toBe(201);
    }

    const limited = await POST(
      request(
        {
          ...validBody,
          submissionId: "11111111-1111-4111-8111-111111111119",
        },
        { ip: "9.9.9.9" },
      ),
    );
    expect(limited.status).toBe(429);
  });

  it("returns 201 success with no-store", async () => {
    vi.mocked(processInquiry).mockResolvedValue({
      inquiryId: "deal-1",
      emailSent: true,
      selectedService: "cybersecurity",
    });
    const response = await POST(request(validBody, { ip: "1.1.1.1" }));
    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBeTruthy();
    const json = await response.json();
    expect(json).toEqual({
      success: true,
      data: {
        inquiryId: "deal-1",
        emailSent: true,
        selectedService: "cybersecurity",
      },
    });
  });

  it("returns a safe 5xx for unexpected service failures", async () => {
    vi.mocked(processInquiry).mockRejectedValue(new Error("boom"));
    const response = await POST(request(validBody, { ip: "2.2.2.2" }));
    expect(response.status).toBe(500);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.message).not.toContain("boom");
    expect(json.error.requestId).toBe(response.headers.get("x-request-id"));
  });
});
