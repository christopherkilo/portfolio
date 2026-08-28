import { NotificationValidationError, TransientNotificationError } from "../lambda/novatech-notification-handler/errors";
import { processSqsBatch } from "../lambda/novatech-notification-handler/handler";
import { sanitizeNotificationLog } from "../lambda/novatech-notification-handler/log";
import { processNotificationRecord } from "../lambda/novatech-notification-handler/processRecord";
import { parseJsonBody, parseNotificationMessage } from "../lambda/novatech-notification-handler/schema";
import { clearResendApiKeyCache } from "../lambda/novatech-notification-handler/secrets";
import type { WorkflowStatusWriter } from "../lambda/novatech-notification-handler/status";

jest.mock("../lambda/novatech-notification-handler/secrets", () => ({
  getResendApiKey: jest.fn(async () => "re_test_key"),
  clearResendApiKeyCache: jest.fn(),
}));

const submissionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const requestId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const customerMessage = {
  notificationId: `${submissionId}:customer`,
  submissionId,
  requestId,
  type: "customer_confirmation" as const,
  recipient: "phase3.verify@example.com",
  name: "Phase Three",
  selectedService: "managed-it" as const,
};

const staffMessage = {
  notificationId: `${submissionId}:staff`,
  submissionId,
  requestId,
  type: "staff_notification" as const,
  name: "Phase Three",
  company: "NovaTech Phase Three Test",
  selectedService: "managed-it" as const,
  companySize: "1-10" as const,
  urgency: "planning" as const,
  preferredContactMethod: "email" as const,
  visitorEmail: "phase3.verify@example.com",
  contactId: "contact-1",
  dealId: "deal-1",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function writer(): WorkflowStatusWriter & { calls: Array<Record<string, string>> } {
  const calls: Array<Record<string, string>> = [];
  return {
    calls,
    async markEmailResult(input) {
      calls.push({
        submissionId: input.submissionId,
        type: input.type,
        status: input.status,
      });
    },
  };
}

describe("notification message schema", () => {
  it("accepts a valid customer message", () => {
    expect(parseNotificationMessage(customerMessage).type).toBe("customer_confirmation");
  });

  it("accepts a valid staff message", () => {
    expect(parseNotificationMessage(staffMessage).type).toBe("staff_notification");
  });

  it("rejects malformed JSON", () => {
    expect(() => parseJsonBody("{")).toThrow(NotificationValidationError);
  });

  it("rejects an unsupported notification type", () => {
    expect(() =>
      parseNotificationMessage({
        notificationId: "phase3-dlq-test",
        type: "invalid-test-type",
      }),
    ).toThrow(NotificationValidationError);
  });

  it("rejects extra fields and mismatched notificationId", () => {
    expect(() =>
      parseNotificationMessage({ ...customerMessage, turnstileToken: "nope" }),
    ).toThrow(NotificationValidationError);
    expect(() =>
      parseNotificationMessage({ ...customerMessage, notificationId: "other:customer" }),
    ).toThrow(NotificationValidationError);
  });
});

describe("notification Lambda / Resend", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.NOVATECH_FROM_EMAIL = "onboarding@resend.dev";
    process.env.NOVATECH_STAFF_EMAIL = "onboarding@resend.dev";
    process.env.NOVATECH_APP_URL = "https://www.christopherkilo.com";
    process.env.INQUIRY_WORKFLOWS_TABLE_NAME = "portfolio-dev-novatech-inquiry-workflows";
    clearResendApiKeyCache();
  });

  afterEach(() => {
    process.env = env;
    jest.restoreAllMocks();
  });

  it("sends a customer confirmation and records SENT", async () => {
    const fetchImpl = jest.fn(async () => json({ id: "email-1" }));
    global.fetch = fetchImpl as unknown as typeof fetch;
    const status = writer();
    await processNotificationRecord(
      { messageId: "m1", body: JSON.stringify(customerMessage) },
      status,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Idempotency-Key")).toBe(`${submissionId}:customer`);
    expect(status.calls).toEqual([
      { submissionId, type: "customer_confirmation", status: "SENT" },
    ]);
    const body = JSON.parse(String(init.body)) as { html: string; to: string[] };
    expect(body.to).toEqual(["phase3.verify@example.com"]);
    expect(body.html).toContain("Managed IT");
  });

  it("sends a staff notification without the visitor message body", async () => {
    const fetchImpl = jest.fn(async () => json({ id: "email-2" }));
    global.fetch = fetchImpl as unknown as typeof fetch;
    const status = writer();
    await processNotificationRecord(
      { messageId: "m2", body: JSON.stringify(staffMessage) },
      status,
    );
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      html: string;
      reply_to: string;
    };
    expect(body.reply_to).toBe("phase3.verify@example.com");
    expect(body.html).toContain("NovaTech Phase Three Test");
    expect(body.html).not.toContain("Visitor message");
    expect(status.calls[0]?.status).toBe("SENT");
  });

  it("fails the SQS record on 429 so the queue can retry", async () => {
    global.fetch = jest.fn(async () => json({}, 429)) as unknown as typeof fetch;
    await expect(
      processNotificationRecord(
        { messageId: "m3", body: JSON.stringify(customerMessage) },
        writer(),
      ),
    ).rejects.toBeInstanceOf(TransientNotificationError);
  });

  it("fails the SQS record on 500", async () => {
    global.fetch = jest.fn(async () => json({}, 500)) as unknown as typeof fetch;
    await expect(
      processNotificationRecord(
        { messageId: "m4", body: JSON.stringify(customerMessage) },
        writer(),
      ),
    ).rejects.toBeInstanceOf(TransientNotificationError);
  });

  it("acknowledges 400 after marking FAILED_PERMANENT", async () => {
    global.fetch = jest.fn(async () => json({}, 400)) as unknown as typeof fetch;
    const status = writer();
    await processNotificationRecord(
      { messageId: "m5", body: JSON.stringify(customerMessage) },
      status,
    );
    expect(status.calls).toEqual([
      { submissionId, type: "customer_confirmation", status: "FAILED_PERMANENT" },
    ]);
  });

  it("acknowledges 401/403 after marking FAILED_PERMANENT", async () => {
    global.fetch = jest.fn(async () => json({}, 403)) as unknown as typeof fetch;
    const status = writer();
    await processNotificationRecord(
      { messageId: "m6", body: JSON.stringify(staffMessage) },
      status,
    );
    expect(status.calls[0]?.status).toBe("FAILED_PERMANENT");
  });

  it("fails the SQS record on network timeout", async () => {
    global.fetch = jest.fn(async () => {
      const error = new Error("The operation was aborted.");
      error.name = "AbortError";
      throw error;
    }) as unknown as typeof fetch;
    await expect(
      processNotificationRecord(
        { messageId: "m7", body: JSON.stringify(customerMessage) },
        writer(),
      ),
    ).rejects.toBeInstanceOf(TransientNotificationError);
  });
});

describe("SQS batch handling", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.NOVATECH_FROM_EMAIL = "onboarding@resend.dev";
    process.env.NOVATECH_STAFF_EMAIL = "onboarding@resend.dev";
    process.env.NOVATECH_APP_URL = "https://www.christopherkilo.com";
  });

  afterEach(() => {
    process.env = env;
    jest.restoreAllMocks();
  });

  it("reports partial batch failures without retrying the successful record", async () => {
    global.fetch = jest.fn(async () => json({ id: "ok" })) as unknown as typeof fetch;
    const status = writer();
    const result = await processSqsBatch(
      {
        Records: [
          { messageId: "ok-1", body: JSON.stringify(customerMessage) },
          {
            messageId: "bad-1",
            body: JSON.stringify({ notificationId: "phase3-dlq-test", type: "invalid-test-type" }),
          },
        ],
      },
      status,
    );
    expect(result.batchItemFailures).toEqual([{ itemIdentifier: "bad-1" }]);
    expect(status.calls).toHaveLength(1);
    expect(status.calls[0]?.status).toBe("SENT");
  });

  it("returns both records as failures when both are transient", async () => {
    global.fetch = jest.fn(async () => json({}, 429)) as unknown as typeof fetch;
    const result = await processSqsBatch(
      {
        Records: [
          { messageId: "a", body: JSON.stringify(customerMessage) },
          { messageId: "b", body: JSON.stringify(staffMessage) },
        ],
      },
      writer(),
    );
    expect(result.batchItemFailures.map((item) => item.itemIdentifier).sort()).toEqual(["a", "b"]);
  });

  it("does not send email for a malformed poison message", async () => {
    const fetchImpl = jest.fn(async () => json({ id: "should-not-send" }));
    global.fetch = fetchImpl as unknown as typeof fetch;
    const result = await processSqsBatch(
      {
        Records: [
          {
            messageId: "poison",
            body: JSON.stringify({ notificationId: "phase3-dlq-test", type: "invalid-test-type" }),
          },
        ],
      },
      writer(),
    );
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.batchItemFailures).toEqual([{ itemIdentifier: "poison" }]);
  });
});

describe("notification log sanitizer", () => {
  it("drops recipient emails, bodies, and secrets", () => {
    const sanitized = sanitizeNotificationLog({
      event: "resend.notification.succeeded",
      requestId,
      submissionId,
      notificationId: `${submissionId}:customer`,
      recipient: "secret@example.com",
      html: "<p>Hi</p>",
      apiKey: "re_live_secret",
    });
    expect(sanitized.recipient).toBeUndefined();
    expect(sanitized.html).toBeUndefined();
    expect(JSON.stringify(sanitized)).not.toContain("secret@example.com");
    expect(JSON.stringify(sanitized)).not.toContain("re_live_secret");
    expect(sanitized.submissionId).toBe(submissionId);
  });
});
