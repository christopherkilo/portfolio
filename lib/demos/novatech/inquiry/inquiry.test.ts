import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  firstInvalidField,
  inquiryApiRequestSchema,
  inquiryFromFormData,
  inquirySchema,
  submitInquiry,
  validateInquiry,
} from "@/lib/demos/novatech/inquiry";
import { resolveInquiryServiceParam } from "@/lib/demos/novatech/paths";

const validInquiry = {
  name: "Alex Morgan",
  businessEmail: "alex@example.com",
  phone: "(555) 010-2222",
  company: "Northwind Retail",
  jobTitle: "Operations Manager",
  selectedService: "cybersecurity" as const,
  companySize: "11-50" as const,
  currentEnvironment: "Microsoft 365 with mixed laptops",
  urgency: "within-30-days" as const,
  preferredContactMethod: "email" as const,
  message:
    "We need a practical security baseline for a growing professional-services team.",
  consent: true as const,
};

describe("NovaTech inquiry schema", () => {
  it("accepts a complete valid inquiry", () => {
    const result = validateInquiry(validInquiry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.selectedService).toBe("cybersecurity");
      expect(result.data.consent).toBe(true);
      expect(result.data.businessEmail).toBe("alex@example.com");
    }
  });

  it("lowercases business email", () => {
    const result = validateInquiry({
      ...validInquiry,
      businessEmail: "Alex@Example.COM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.businessEmail).toBe("alex@example.com");
    }
  });

  it("rejects invalid email addresses", () => {
    const result = validateInquiry({
      ...validInquiry,
      businessEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.businessEmail).toMatch(/valid business email/i);
    }
  });

  it("rejects missing required fields", () => {
    const result = validateInquiry({
      ...validInquiry,
      name: "",
      company: "",
      message: "too short",
      consent: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeTruthy();
      expect(result.errors.company).toBeTruthy();
      expect(result.errors.message).toBeTruthy();
      expect(result.errors.consent).toBeTruthy();
      expect(firstInvalidField(result.errors)).toBe("name");
      expect(result.formError).toMatch(/highlighted fields/i);
    }
  });

  it("rejects excessive message length", () => {
    const result = validateInquiry({
      ...validInquiry,
      message: "x".repeat(1201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.message).toMatch(/1200/i);
    }
  });

  it("rejects invalid controlled enums", () => {
    const result = validateInquiry({
      ...validInquiry,
      urgency: "yesterday",
    });
    expect(result.success).toBe(false);
  });

  it("maps FormData into inquiry-shaped objects", () => {
    const formData = new FormData();
    formData.set("name", "Alex");
    formData.set("businessEmail", "alex@example.com");
    formData.set("consent", "on");
    formData.set("selectedService", "managed-it");
    const mapped = inquiryFromFormData(formData);
    expect(mapped.consent).toBe(true);
    expect(mapped.selectedService).toBe("managed-it");
  });

  it("requires turnstileToken and submissionId for API requests", () => {
    const missing = inquiryApiRequestSchema.safeParse(validInquiry);
    expect(missing.success).toBe(false);

    const withToken = inquiryApiRequestSchema.safeParse({
      ...validInquiry,
      turnstileToken: "token",
      submissionId: "not-a-uuid",
    });
    expect(withToken.success).toBe(false);

    const ok = inquiryApiRequestSchema.safeParse({
      ...validInquiry,
      turnstileToken: "token",
      submissionId: "11111111-1111-4111-8111-111111111111",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects unknown API fields when strict", () => {
    const result = inquiryApiRequestSchema.safeParse({
      ...validInquiry,
      turnstileToken: "token",
      submissionId: "11111111-1111-4111-8111-111111111111",
      hubspotDealId: "should-not-pass",
    });
    expect(result.success).toBe(false);
  });

  it("exposes a Zod schema suitable for server reuse", () => {
    expect(inquirySchema.safeParse(validInquiry).success).toBe(true);
  });
});

describe("NovaTech inquiry service query resolution", () => {
  it("preselects valid services and falls back safely", () => {
    expect(resolveInquiryServiceParam("cybersecurity")).toBe("cybersecurity");
    expect(resolveInquiryServiceParam("not-sure")).toBe("not-sure");
    expect(resolveInquiryServiceParam("unknown-service")).toBe("not-sure");
    expect(resolveInquiryServiceParam(null)).toBe("not-sure");
    expect(resolveInquiryServiceParam("")).toBe("not-sure");
  });
});

describe("NovaTech submitInquiry client adapter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("requires a Turnstile token before networking", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await submitInquiry(validInquiry, {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("TURNSTILE_REQUIRED");
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts JSON and maps a successful API response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            inquiryId: "deal-1",
            accepted: true,
            selectedService: "cybersecurity",
          },
        }),
        { status: 202, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await submitInquiry(validInquiry, {
      turnstileToken: "token",
      submissionId: "11111111-1111-4111-8111-111111111111",
    });

    expect(result).toEqual({
      ok: true,
      selectedService: "cybersecurity",
      inquiryId: "deal-1",
      accepted: true,
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(String(init?.headers && (init.headers as Record<string, string>)["Content-Type"])).toContain(
      "application/json",
    );
    const body = JSON.parse(String(init?.body));
    expect(body.turnstileToken).toBe("token");
    expect(body.submissionId).toBe("11111111-1111-4111-8111-111111111111");
    expect(body.hubspotDealId).toBeUndefined();
  });

  it("maps API field errors and preserves retryability for service failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Please check the highlighted fields.",
            fieldErrors: { businessEmail: "Enter a valid business email address." },
          },
        }),
        { status: 422 },
      ),
    );

    const result = await submitInquiry(validInquiry, {
      turnstileToken: "token",
      submissionId: "11111111-1111-4111-8111-111111111111",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryable).toBe(false);
      expect(result.fieldErrors?.businessEmail).toMatch(/email/i);
    }
  });

  it("supports a development-only forced failure without networking", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const pending = submitInquiry(validInquiry, {
      delayMs: 5,
      forceFailure: true,
      turnstileToken: "token",
    });
    await vi.advanceTimersByTimeAsync(5);
    const result = await pending;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryable).toBe(true);
      expect(result.message).toMatch(/preserved/i);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
