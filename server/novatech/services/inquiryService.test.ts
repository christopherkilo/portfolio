import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetDuplicateGuardForTests } from "@/server/novatech/duplicateGuard";
import { processInquiry } from "@/server/novatech/services/inquiryService";
import { TurnstileError, HubSpotError } from "@/server/novatech/errors";

vi.mock("@/server/novatech/integrations/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/server/novatech/integrations/hubspot", () => ({
  upsertInquiryInHubSpot: vi.fn(),
}));

vi.mock("@/server/novatech/integrations/resend", () => ({
  sendInquiryEmails: vi.fn(),
}));

import { verifyTurnstileToken } from "@/server/novatech/integrations/turnstile";
import { upsertInquiryInHubSpot } from "@/server/novatech/integrations/hubspot";
import { sendInquiryEmails } from "@/server/novatech/integrations/resend";

const baseRequest = {
  name: "Alex Morgan",
  businessEmail: "alex@example.com",
  phone: "",
  company: "Northwind",
  jobTitle: "",
  selectedService: "cybersecurity" as const,
  companySize: "11-50" as const,
  currentEnvironment: "",
  urgency: "planning" as const,
  preferredContactMethod: "email" as const,
  message: "We need a practical security baseline for a growing team.",
  consent: true as const,
  turnstileToken: "token",
  submissionId: "11111111-1111-4111-8111-111111111111",
};

describe("NovaTech inquiry service orchestration", () => {
  beforeEach(() => {
    __resetDuplicateGuardForTests();
    vi.mocked(verifyTurnstileToken).mockReset();
    vi.mocked(upsertInquiryInHubSpot).mockReset();
    vi.mocked(sendInquiryEmails).mockReset();
  });

  afterEach(() => {
    __resetDuplicateGuardForTests();
  });

  it("returns success when CRM and email succeed", async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined);
    vi.mocked(upsertInquiryInHubSpot).mockResolvedValue({
      contactId: "c1",
      dealId: "d1",
      contactCreated: true,
    });
    vi.mocked(sendInquiryEmails).mockResolvedValue({
      visitorSent: true,
      staffSent: true,
    });

    const result = await processInquiry({
      request: baseRequest,
      requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    });
    expect(result).toEqual({
      inquiryId: "d1",
      emailSent: true,
      selectedService: "cybersecurity",
    });
    expect(verifyTurnstileToken).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          submissionId: baseRequest.submissionId,
        }),
      }),
    );
    expect(upsertInquiryInHubSpot).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        submissionId: baseRequest.submissionId,
      }),
    );
    expect(sendInquiryEmails).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        submissionId: baseRequest.submissionId,
      }),
    );
  });

  it("stops before CRM when Turnstile fails", async () => {
    vi.mocked(verifyTurnstileToken).mockRejectedValue(
      new TurnstileError("TURNSTILE_FAILED"),
    );

    await expect(
      processInquiry({ request: baseRequest }),
    ).rejects.toBeInstanceOf(TurnstileError);
    expect(upsertInquiryInHubSpot).not.toHaveBeenCalled();
    expect(sendInquiryEmails).not.toHaveBeenCalled();
  });

  it("fails when CRM fails and never sends email", async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined);
    vi.mocked(upsertInquiryInHubSpot).mockRejectedValue(new HubSpotError());

    await expect(
      processInquiry({ request: baseRequest }),
    ).rejects.toBeInstanceOf(HubSpotError);
    expect(sendInquiryEmails).not.toHaveBeenCalled();
  });

  it("keeps CRM success when email fails (partial success)", async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined);
    vi.mocked(upsertInquiryInHubSpot).mockResolvedValue({
      contactId: "c1",
      dealId: "d1",
      contactCreated: true,
    });
    vi.mocked(sendInquiryEmails).mockRejectedValue(new Error("email down"));

    const result = await processInquiry({
      request: {
        ...baseRequest,
        submissionId: "22222222-2222-4222-8222-222222222222",
      },
    });
    expect(result.inquiryId).toBe("d1");
    expect(result.emailSent).toBe(false);
  });

  it("rejects duplicate pending submission ids", async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined);
    vi.mocked(upsertInquiryInHubSpot).mockResolvedValue({
      contactId: "c1",
      dealId: "d1",
      contactCreated: true,
    });
    vi.mocked(sendInquiryEmails).mockResolvedValue({
      visitorSent: true,
      staffSent: true,
    });

    await processInquiry({ request: baseRequest });
    await expect(
      processInquiry({ request: baseRequest }),
    ).rejects.toMatchObject({ code: "DUPLICATE_SUBMISSION" });
  });
});
