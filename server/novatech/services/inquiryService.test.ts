import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { processInquiry } from "@/server/novatech/services/inquiryService";
import {
  ConfigurationError,
  TurnstileError,
  WorkflowUnavailableError,
} from "@/server/novatech/errors";

vi.mock("@/server/novatech/integrations/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/server/novatech/aws/startInquiryWorkflow", () => ({
  startNovaTechInquiryWorkflow: vi.fn(),
}));

vi.mock("@/server/novatech/integrations/hubspot", () => ({
  upsertInquiryInHubSpot: vi.fn(),
}));

vi.mock("@/server/novatech/integrations/resend", () => ({
  sendInquiryEmails: vi.fn(),
}));

import { verifyTurnstileToken } from "@/server/novatech/integrations/turnstile";
import { startNovaTechInquiryWorkflow } from "@/server/novatech/aws/startInquiryWorkflow";
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
    vi.mocked(verifyTurnstileToken).mockReset();
    vi.mocked(startNovaTechInquiryWorkflow).mockReset();
    vi.mocked(upsertInquiryInHubSpot).mockReset();
    vi.mocked(sendInquiryEmails).mockReset();
  });

  afterEach(() => {
    vi.mocked(verifyTurnstileToken).mockReset();
    vi.mocked(startNovaTechInquiryWorkflow).mockReset();
  });

  it("accepts a valid request after Turnstile and StartExecution", async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined);
    vi.mocked(startNovaTechInquiryWorkflow).mockResolvedValue({
      outcome: "started",
    });

    const result = await processInquiry({
      request: baseRequest,
      requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    });
    expect(result).toEqual({
      inquiryId: baseRequest.submissionId,
      accepted: true,
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
    expect(startNovaTechInquiryWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: baseRequest.submissionId,
        requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        inquiry: expect.not.objectContaining({
          turnstileToken: expect.anything(),
        }),
      }),
    );
    const workflowInput = vi.mocked(startNovaTechInquiryWorkflow).mock.calls[0][0];
    expect(workflowInput.inquiry).not.toHaveProperty("turnstileToken");
    expect(JSON.stringify(workflowInput)).not.toMatch(/turnstile/i);
    expect(upsertInquiryInHubSpot).not.toHaveBeenCalled();
    expect(sendInquiryEmails).not.toHaveBeenCalled();
  });

  it("stops before AWS when Turnstile fails", async () => {
    vi.mocked(verifyTurnstileToken).mockRejectedValue(
      new TurnstileError("TURNSTILE_FAILED"),
    );

    await expect(
      processInquiry({ request: baseRequest }),
    ).rejects.toBeInstanceOf(TurnstileError);
    expect(startNovaTechInquiryWorkflow).not.toHaveBeenCalled();
    expect(upsertInquiryInHubSpot).not.toHaveBeenCalled();
    expect(sendInquiryEmails).not.toHaveBeenCalled();
  });

  it("stops before AWS when Turnstile’s provider is unavailable", async () => {
    vi.mocked(verifyTurnstileToken).mockRejectedValue(
      new TurnstileError("TURNSTILE_FAILED"),
    );

    await expect(
      processInquiry({
        request: { ...baseRequest, turnstileToken: "provider-down" },
      }),
    ).rejects.toBeInstanceOf(TurnstileError);
    expect(startNovaTechInquiryWorkflow).not.toHaveBeenCalled();
  });

  it("returns a safe accepted result for duplicate StartExecution", async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined);
    vi.mocked(startNovaTechInquiryWorkflow).mockResolvedValue({
      outcome: "already_exists",
    });

    const result = await processInquiry({ request: baseRequest });
    expect(result.accepted).toBe(true);
    expect(result.inquiryId).toBe(baseRequest.submissionId);
    expect(upsertInquiryInHubSpot).not.toHaveBeenCalled();
    expect(sendInquiryEmails).not.toHaveBeenCalled();
  });

  it("does not wait for HubSpot or Resend when AWS is unavailable", async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined);
    vi.mocked(startNovaTechInquiryWorkflow).mockRejectedValue(
      new WorkflowUnavailableError(),
    );

    await expect(
      processInquiry({ request: baseRequest }),
    ).rejects.toBeInstanceOf(WorkflowUnavailableError);
    expect(upsertInquiryInHubSpot).not.toHaveBeenCalled();
    expect(sendInquiryEmails).not.toHaveBeenCalled();
  });

  it("surfaces AWS permission/config failure without calling providers", async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined);
    vi.mocked(startNovaTechInquiryWorkflow).mockRejectedValue(
      new ConfigurationError(),
    );

    await expect(
      processInquiry({ request: baseRequest }),
    ).rejects.toBeInstanceOf(ConfigurationError);
    expect(upsertInquiryInHubSpot).not.toHaveBeenCalled();
    expect(sendInquiryEmails).not.toHaveBeenCalled();
  });
});
