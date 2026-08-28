import { describe, expect, it, vi } from "vitest";
import { shouldForceDemoInquiryFailure } from "@/lib/demos/novatech/inquiry/demoResult";
import { submitInquiry } from "@/lib/demos/novatech/inquiry/submitInquiry";
import type { InquiryInput } from "@/lib/demos/novatech/inquiry/types";
import { contactHref } from "@/lib/demos/novatech/paths";

const validInquiry: InquiryInput = {
  name: "Jordan Lee",
  businessEmail: "jordan@example.com",
  phone: "555-0100",
  company: "Example Co",
  jobTitle: "IT Manager",
  selectedService: "cybersecurity",
  companySize: "11-50",
  currentEnvironment: "Mixed cloud and on-prem with aging firewalls.",
  urgency: "planning",
  preferredContactMethod: "email",
  message:
    "Looking for an illustrative consultation about endpoint and identity controls.",
  consent: true,
};

describe("shouldForceDemoInquiryFailure", () => {
  it("is off by default in development", () => {
    expect(
      shouldForceDemoInquiryFailure(null, {
        NODE_ENV: "development",
      }),
    ).toBe(false);
    expect(
      shouldForceDemoInquiryFailure("success", {
        NODE_ENV: "development",
      }),
    ).toBe(false);
  });

  it("honors demoResult=failure in development", () => {
    expect(
      shouldForceDemoInquiryFailure("failure", {
        NODE_ENV: "development",
      }),
    ).toBe(true);
  });

  it("honors NEXT_PUBLIC_NOVATECH_DEMO_RESULT in development", () => {
    expect(
      shouldForceDemoInquiryFailure(null, {
        NODE_ENV: "development",
        NEXT_PUBLIC_NOVATECH_DEMO_RESULT: "failure",
      }),
    ).toBe(true);
  });

  it("ignores URL demoResult in production unless env is configured", () => {
    expect(
      shouldForceDemoInquiryFailure("failure", {
        NODE_ENV: "production",
      }),
    ).toBe(false);
    expect(
      shouldForceDemoInquiryFailure("failure", {
        NODE_ENV: "production",
        NEXT_PUBLIC_NOVATECH_DEMO_RESULT: "failure",
      }),
    ).toBe(true);
  });
});

describe("demo failure path integration", () => {
  it("forces failure without network side effects", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(),
    );

    const pending = submitInquiry(validInquiry, {
      delayMs: 5,
      forceFailure: shouldForceDemoInquiryFailure("failure", {
        NODE_ENV: "development",
      }),
    });
    await vi.advanceTimersByTimeAsync(5);
    const result = await pending;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryable).toBe(true);
    }
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  it("retries to a live API success when forceFailure is cleared", async () => {
    vi.useFakeTimers();

    const failPending = submitInquiry(validInquiry, {
      delayMs: 5,
      forceFailure: true,
    });
    await vi.advanceTimersByTimeAsync(5);
    expect((await failPending).ok).toBe(false);

    vi.useRealTimers();

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            inquiryId: "deal-9",
            accepted: true,
            selectedService: "cybersecurity",
          },
        }),
        { status: 202 },
      ),
    );

    expect(
      await submitInquiry(validInquiry, {
        forceFailure: false,
        turnstileToken: "token",
        submissionId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual({
      ok: true,
      selectedService: "cybersecurity",
      inquiryId: "deal-9",
      accepted: true,
    });

    fetchSpy.mockRestore();
  });

  it("keeps service and demoResult query params together", () => {
    const withBoth = contactHref("cybersecurity", {
      demoResult: "failure",
    });
    expect(withBoth).toContain("service=cybersecurity");
    expect(withBoth).toContain("demoResult=failure");

    const preserved = contactHref("networking", {
      preserveParams: new URLSearchParams(
        "service=cybersecurity&demoResult=failure",
      ),
    });
    expect(preserved).toBe(
      "/demos/novatech-solutions/contact?service=networking&demoResult=failure",
    );

    const clearedService = contactHref("not-sure", {
      preserveParams: new URLSearchParams(
        "service=cybersecurity&demoResult=failure",
      ),
    });
    expect(clearedService).toBe(
      "/demos/novatech-solutions/contact?demoResult=failure",
    );
  });
});
