import {
  customerSubject,
  staffHtml,
  staffSubject,
  visitorHtml,
  type CustomerEmailInput,
  type StaffEmailInput,
} from "./resendTemplates";

export const RESEND_BASE = "https://api.resend.com";
export const RESEND_TIMEOUT_MS = 12_000;

export type ResendErrorCategory =
  | "transient"
  | "auth_or_scope"
  | "rejected"
  | "network";

export type ResendLogFields = {
  requestId: string;
  submissionId: string;
  integration: "resend";
  notificationId?: string;
  notificationType?: string;
  status?: string;
  httpStatus?: number;
  attempt?: number;
  errorCode?: string;
  durationMs?: number;
  failureType?: string;
  operation?: string;
};

export type ResendLogger = {
  info(event: string, fields: ResendLogFields): void;
  warn(event: string, fields: ResendLogFields): void;
  error(event: string, fields: ResendLogFields): void;
};

export class ResendProviderError extends Error {
  readonly name = "ResendProviderError";
  readonly retryable: boolean;
  readonly category: ResendErrorCategory;
  readonly httpStatus?: number;

  constructor(
    category: ResendErrorCategory,
    message: string,
    options: { retryable: boolean; httpStatus?: number; cause?: unknown } = {
      retryable: false,
    },
  ) {
    super(redactSecrets(message), { cause: options.cause });
    this.category = category;
    this.retryable = options.retryable;
    this.httpStatus = options.httpStatus;
  }
}

export type ResendClientConfig = {
  apiKey: string;
  fromEmail: string;
  staffEmail: string;
  appUrl: string;
  fetchImpl?: typeof fetch;
  maxRetries?: number;
  log?: ResendLogger;
};

export type SendCustomerInput = CustomerEmailInput & {
  recipient: string;
  requestId: string;
  submissionId: string;
  notificationId: string;
};

export type SendStaffInput = StaffEmailInput & {
  requestId: string;
  notificationId: string;
};

const silentLog: ResendLogger = {
  info() {},
  warn() {},
  error() {},
};

function redactSecrets(value: string): string {
  return value
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/re_[a-zA-Z0-9]+/g, "[redacted]");
}

export function createResendClient(config: ResendClientConfig) {
  const fetchImpl = config.fetchImpl ?? fetch;
  const maxRetries = config.maxRetries ?? 0;
  const log = config.log ?? silentLog;

  async function sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
    idempotencyKey: string;
    context: ResendLogFields;
  }): Promise<{ id: string }> {
    let attempt = 0;
    let lastError: unknown;
    const base: ResendLogFields = {
      ...options.context,
      integration: "resend",
      notificationId: options.idempotencyKey,
    };

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);
      try {
        const response = await fetchImpl(`${RESEND_BASE}/emails`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "Idempotency-Key": options.idempotencyKey,
          },
          body: JSON.stringify({
            from: config.fromEmail,
            to: [options.to],
            subject: options.subject,
            html: options.html,
            ...(options.replyTo ? { reply_to: options.replyTo } : {}),
          }),
          signal: controller.signal,
        });

        if (response.status === 429 || response.status >= 500) {
          log.warn("resend.request.failed", {
            ...base,
            status: "transient",
            httpStatus: response.status,
            attempt,
            errorCode: "EMAIL_UNAVAILABLE",
          });
          if (attempt >= maxRetries) {
            throw new ResendProviderError("transient", "Resend was temporarily unavailable.", {
              retryable: true,
              httpStatus: response.status,
            });
          }
          attempt += 1;
          continue;
        }

        if (response.status === 401 || response.status === 403) {
          log.error("resend.request.failed", {
            ...base,
            status: "auth_or_scope",
            httpStatus: response.status,
            errorCode: "EMAIL_UNAVAILABLE",
          });
          throw new ResendProviderError(
            "auth_or_scope",
            "Resend authentication or scopes were rejected.",
            { retryable: false, httpStatus: response.status },
          );
        }

        if (!response.ok) {
          log.error("resend.request.failed", {
            ...base,
            status: "rejected",
            httpStatus: response.status,
            errorCode: "EMAIL_UNAVAILABLE",
          });
          throw new ResendProviderError("rejected", "Resend rejected the email request.", {
            retryable: false,
            httpStatus: response.status,
          });
        }

        const payload = (await response.json()) as { id?: string };
        return { id: payload.id ?? options.idempotencyKey };
      } catch (error) {
        lastError = error;
        if (error instanceof ResendProviderError) throw error;
        log.error("resend.request.failed", {
          ...base,
          status: "network",
          failureType: error instanceof Error ? error.name : "unknown",
          attempt,
          errorCode: "EMAIL_UNAVAILABLE",
        });
        if (attempt >= maxRetries) {
          throw new ResendProviderError("network", "Resend request failed due to a network error.", {
            retryable: true,
            cause: error,
          });
        }
        attempt += 1;
      } finally {
        clearTimeout(timer);
      }
    }

    throw new ResendProviderError("network", "Resend request failed after bounded retries.", {
      retryable: true,
      cause: lastError,
    });
  }

  async function sendCustomerConfirmation(input: SendCustomerInput): Promise<{ id: string }> {
    const started = Date.now();
    const context: ResendLogFields = {
      requestId: input.requestId,
      submissionId: input.submissionId,
      integration: "resend",
      notificationId: input.notificationId,
      notificationType: "customer_confirmation",
      operation: "customer_confirmation",
    };
    log.info("resend.visitor_email.started", context);
    const result = await sendEmail({
      to: input.recipient,
      subject: customerSubject(input),
      html: visitorHtml({ ...input, appUrl: config.appUrl }),
      replyTo: config.staffEmail,
      idempotencyKey: input.notificationId,
      context,
    });
    log.info("resend.visitor_email.succeeded", {
      ...context,
      status: "ok",
      durationMs: Date.now() - started,
    });
    return result;
  }

  async function sendStaffNotification(input: SendStaffInput): Promise<{ id: string }> {
    const started = Date.now();
    const context: ResendLogFields = {
      requestId: input.requestId,
      submissionId: input.submissionId,
      integration: "resend",
      notificationId: input.notificationId,
      notificationType: "staff_notification",
      operation: "staff_notification",
    };
    log.info("resend.staff_email.started", context);
    const result = await sendEmail({
      to: config.staffEmail,
      subject: staffSubject(input),
      html: staffHtml(input),
      replyTo: input.visitorEmail,
      idempotencyKey: input.notificationId,
      context,
    });
    log.info("resend.staff_email.succeeded", {
      ...context,
      status: "ok",
      durationMs: Date.now() - started,
    });
    return result;
  }

  return {
    sendCustomerConfirmation,
    sendStaffNotification,
  };
}
