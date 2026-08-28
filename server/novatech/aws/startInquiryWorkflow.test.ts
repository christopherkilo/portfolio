import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StartExecutionCommand } from "@aws-sdk/client-sfn";
import {
  __setSfnClientForTests,
  novatechInquiryExecutionName,
  startNovaTechInquiryWorkflow,
} from "@/server/novatech/aws/startInquiryWorkflow";
import {
  ConfigurationError,
  WorkflowUnavailableError,
} from "@/server/novatech/errors";

const inquiry = {
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
};

const input = {
  submissionId: "11111111-1111-4111-8111-111111111111",
  requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  inquiry,
};

describe("startNovaTechInquiryWorkflow", () => {
  const send = vi.fn();

  beforeEach(() => {
    send.mockReset();
    __setSfnClientForTests({ send });
    vi.stubEnv(
      "NOVATECH_STATE_MACHINE_ARN",
      "arn:aws:states:us-east-2:123456789012:stateMachine:example",
    );
    vi.stubEnv("NOVATECH_AWS_REGION", "us-east-2");
    vi.stubEnv("AWS_ROLE_ARN", "");
    vi.stubEnv("VERCEL_ENV", "");
  });

  afterEach(() => {
    __setSfnClientForTests(undefined);
    vi.unstubAllEnvs();
  });

  it("starts an execution with a deterministic name and no Turnstile token", async () => {
    send.mockResolvedValue({});
    const result = await startNovaTechInquiryWorkflow(input);
    expect(result).toEqual({ outcome: "started" });
    expect(send).toHaveBeenCalledOnce();
    const command = send.mock.calls[0][0] as StartExecutionCommand;
    expect(command.input.name).toBe(
      novatechInquiryExecutionName(input.submissionId),
    );
    expect(command.input.stateMachineArn).toBe(
      "arn:aws:states:us-east-2:123456789012:stateMachine:example",
    );
    const payload = JSON.parse(command.input.input ?? "{}") as Record<
      string,
      unknown
    >;
    expect(payload).toEqual({
      submissionId: input.submissionId,
      requestId: input.requestId,
      inquiry,
    });
    expect(JSON.stringify(payload)).not.toMatch(/turnstile/i);
    expect(payload).not.toHaveProperty("turnstileToken");
  });

  it("treats ExecutionAlreadyExists as a duplicate start", async () => {
    send.mockRejectedValue({ name: "ExecutionAlreadyExists" });
    await expect(startNovaTechInquiryWorkflow(input)).resolves.toEqual({
      outcome: "already_exists",
    });
  });

  it("classifies permission failures as configuration errors", async () => {
    send.mockRejectedValue({ name: "AccessDeniedException" });
    await expect(startNovaTechInquiryWorkflow(input)).rejects.toBeInstanceOf(
      ConfigurationError,
    );
  });

  it("classifies transient AWS failures as workflow unavailable", async () => {
    send.mockRejectedValue({ name: "ThrottlingException" });
    await expect(startNovaTechInquiryWorkflow(input)).rejects.toBeInstanceOf(
      WorkflowUnavailableError,
    );
  });

  it("fails closed when the state machine ARN is missing", async () => {
    vi.stubEnv("NOVATECH_STATE_MACHINE_ARN", "");
    send.mockResolvedValue({});
    await expect(startNovaTechInquiryWorkflow(input)).rejects.toBeInstanceOf(
      ConfigurationError,
    );
    expect(send).not.toHaveBeenCalled();
  });
});
