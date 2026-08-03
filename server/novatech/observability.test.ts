import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  emailDomainOnly,
  logger,
  sanitizeLogContext,
} from "@/server/novatech/logger";
import {
  isValidRequestId,
  resolveRequestId,
  REQUEST_ID_HEADER,
} from "@/server/novatech/requestId";
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
  init?: {
    contentType?: string | null;
    ip?: string;
    requestId?: string;
  },
) {
  const headers = new Headers();
  if (init?.contentType !== null) {
    headers.set("Content-Type", init?.contentType ?? "application/json");
  }
  if (init?.ip) headers.set("x-forwarded-for", init.ip);
  if (init?.requestId) headers.set(REQUEST_ID_HEADER, init.requestId);
  return new Request("http://localhost/api/novatech/inquiries", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("request correlation ids", () => {
  it("accepts a valid UUID request id", () => {
    const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(isValidRequestId(id)).toBe(true);
    expect(resolveRequestId(id)).toBe(id);
  });

  it("rejects malformed request ids and generates a replacement", () => {
    expect(isValidRequestId("not-a-uuid")).toBe(false);
    expect(isValidRequestId("';drop table")).toBe(false);
    const generated = resolveRequestId("totally-invalid");
    expect(isValidRequestId(generated)).toBe(true);
    expect(generated).not.toBe("totally-invalid");
  });

  it("generates when the header is absent", () => {
    const generated = resolveRequestId(null);
    expect(isValidRequestId(generated)).toBe(true);
  });
});

describe("structured logger redaction", () => {
  it("keeps allowlisted fields and drops secrets / message bodies", () => {
    const sanitized = sanitizeLogContext({
      requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      submissionId: "11111111-1111-4111-8111-111111111111",
      event: "should-be-dropped-as-input-key-duplicate",
      message: "SECRET USER MESSAGE",
      turnstileToken: "token-value",
      HUBSPOT_ACCESS_TOKEN: "pat-xxx",
      authorization: "Bearer secret",
      selectedService: "cybersecurity",
      emailDomain: "example.com",
      phone: "555-0100",
      businessEmail: "alex@example.com",
    });

    expect(sanitized.requestId).toBe("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    expect(sanitized.submissionId).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(sanitized.selectedService).toBe("cybersecurity");
    expect(sanitized.emailDomain).toBe("example.com");
    expect(sanitized.message).toBeUndefined();
    expect(sanitized.turnstileToken).toBeUndefined();
    expect(sanitized.HUBSPOT_ACCESS_TOKEN).toBeUndefined();
    expect(sanitized.authorization).toBeUndefined();
    expect(sanitized.phone).toBeUndefined();
    expect(sanitized.businessEmail).toBeUndefined();
  });

  it("extracts email domains without logging the local part", () => {
    expect(emailDomainOnly("Alex@Example.COM")).toBe("example.com");
    expect(emailDomainOnly("not-an-email")).toBeUndefined();
  });

  it("emits consistent structured fields", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logger.info("inquiry.completed", {
      requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      submissionId: "11111111-1111-4111-8111-111111111111",
      durationMs: 42,
      selectedService: "cybersecurity",
    });
    expect(info).toHaveBeenCalledOnce();
    const entry = JSON.parse(String(info.mock.calls[0][0]));
    expect(entry.event).toBe("inquiry.completed");
    expect(entry.level).toBe("info");
    expect(entry.requestId).toBe("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    expect(entry.submissionId).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(entry.durationMs).toBe(42);
    expect(entry.timestamp).toBeTruthy();
    expect(entry.environment).toBeTruthy();
    info.mockRestore();
  });

  it("strips stacks from production log entries", () => {
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.stubEnv("NODE_ENV", "production");
    try {
      logger.error("inquiry.failed", {
        requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        stack: "Error: boom\n    at secret",
      });
      const entry = JSON.parse(String(error.mock.calls[0][0]));
      expect(entry.stack).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
      error.mockRestore();
    }
  });
});

describe("POST /api/novatech/inquiries observability", () => {
  beforeEach(() => {
    __resetInquiryRateLimitForTests();
    __resetDuplicateGuardForTests();
    vi.mocked(processInquiry).mockReset();
  });

  afterEach(() => {
    __resetInquiryRateLimitForTests();
    __resetDuplicateGuardForTests();
  });

  it("returns a generated x-request-id when the header is absent", async () => {
    vi.mocked(processInquiry).mockResolvedValue({
      inquiryId: "deal-1",
      emailSent: true,
      selectedService: "cybersecurity",
    });
    const response = await POST(request(validBody, { ip: "10.0.0.1" }));
    const header = response.headers.get(REQUEST_ID_HEADER);
    expect(header).toBeTruthy();
    expect(isValidRequestId(header!)).toBe(true);
    expect(vi.mocked(processInquiry).mock.calls[0][0].requestId).toBe(header);
  });

  it("accepts a valid incoming x-request-id", async () => {
    const incoming = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    vi.mocked(processInquiry).mockResolvedValue({
      inquiryId: "deal-1",
      emailSent: true,
      selectedService: "cybersecurity",
    });
    const response = await POST(
      request(validBody, { ip: "10.0.0.2", requestId: incoming }),
    );
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe(incoming);
    expect(vi.mocked(processInquiry).mock.calls[0][0].requestId).toBe(
      incoming,
    );
  });

  it("replaces a malformed x-request-id", async () => {
    vi.mocked(processInquiry).mockResolvedValue({
      inquiryId: "deal-1",
      emailSent: true,
      selectedService: "cybersecurity",
    });
    const response = await POST(
      request(validBody, { ip: "10.0.0.3", requestId: "bad id" }),
    );
    const header = response.headers.get(REQUEST_ID_HEADER)!;
    expect(isValidRequestId(header)).toBe(true);
    expect(header).not.toBe("bad id");
  });

  it("includes x-request-id and requestId on validation failures", async () => {
    const response = await POST(
      request({ ...validBody, businessEmail: "nope" }, { ip: "10.0.0.4" }),
    );
    expect(response.status).toBe(422);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const header = response.headers.get(REQUEST_ID_HEADER);
    expect(isValidRequestId(header!)).toBe(true);
    const json = await response.json();
    expect(json.error.requestId).toBe(header);
    expect(processInquiry).not.toHaveBeenCalled();
  });

  it("keeps requestId and submissionId distinct in the service call", async () => {
    const requestId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    vi.mocked(processInquiry).mockResolvedValue({
      inquiryId: "deal-1",
      emailSent: true,
      selectedService: "cybersecurity",
    });
    await POST(request(validBody, { ip: "10.0.0.5", requestId }));
    const arg = vi.mocked(processInquiry).mock.calls[0][0];
    expect(arg.requestId).toBe(requestId);
    expect(arg.request.submissionId).toBe(validBody.submissionId);
    expect(arg.requestId).not.toBe(arg.request.submissionId);
  });

  it("does not re-log already-logged unexpected failures", async () => {
    const { UnexpectedInquiryError } = await import(
      "@/server/novatech/errors"
    );
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const infoSpy = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    vi.mocked(processInquiry).mockRejectedValue(
      new UnexpectedInquiryError(undefined, { alreadyLogged: true }),
    );

    const response = await POST(request(validBody, { ip: "10.0.0.6" }));
    expect(response.status).toBe(500);

    const inquiryFailedLogs = errorSpy.mock.calls
      .map((call) => {
        try {
          return JSON.parse(String(call[0]));
        } catch {
          return null;
        }
      })
      .filter((entry) => entry?.event === "inquiry.failed");

    // request.received is info; failure already logged by service — route must not add another inquiry.failed
    expect(inquiryFailedLogs).toHaveLength(0);

    errorSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
