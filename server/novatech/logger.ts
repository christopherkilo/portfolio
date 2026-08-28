import "server-only";

/**
 * Allowlisted structured log fields. Anything else is dropped.
 * Never log tokens, secrets, message bodies, full emails, or phones.
 */
const ALLOWED_KEYS = new Set([
  "timestamp",
  "level",
  "event",
  "environment",
  "requestId",
  "submissionId",
  "integration",
  "status",
  "durationMs",
  "errorCode",
  "httpStatus",
  "route",
  "selectedService",
  "urgency",
  "phoneProvided",
  "emailDomain",
  "contactCreated",
  "visitorSent",
  "staffSent",
  "attempt",
  "contactId",
  "dealId",
  "noteId",
  "hostname",
  "errorCodes",
  "failureType",
  "result",
  "stack",
  "logged",
]);

const FORBIDDEN_VALUE_PATTERN =
  /(bearer\s+[a-z0-9._-]+|sk_live|re_[a-z0-9]+|password=)/i;

export type LogLevel = "info" | "warn" | "error";

export type InquiryLogContext = {
  requestId: string;
  submissionId?: string;
  integration?:
    | "turnstile"
    | "hubspot"
    | "resend"
    | "route"
    | "service"
    | "stepfunctions"
    | "config";
  status?: string;
  durationMs?: number;
  errorCode?: string;
  httpStatus?: number;
  route?: string;
  selectedService?: string;
  urgency?: string;
  phoneProvided?: boolean;
  emailDomain?: string;
  contactCreated?: boolean;
  visitorSent?: boolean;
  staffSent?: boolean;
  attempt?: number;
  contactId?: string;
  dealId?: string;
  noteId?: string;
  hostname?: string;
  errorCodes?: string;
  failureType?: string;
  result?: string;
  stack?: string;
  logged?: boolean;
};

export type StructuredLogEntry = InquiryLogContext & {
  timestamp: string;
  level: LogLevel;
  event: string;
  environment: string;
};

/** Extract only the domain from an email for safe operational logging. */
export function emailDomainOnly(
  email: string | null | undefined,
): string | undefined {
  if (!email) return undefined;
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return undefined;
  return email.slice(at + 1).toLowerCase();
}

export function sanitizeLogContext(
  context: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (value === undefined) continue;
    if (typeof value === "string" && FORBIDDEN_VALUE_PATTERN.test(value)) {
      out[key] = "[redacted]";
      continue;
    }
    // Never allow free-text blobs that look like messages
    if (
      key !== "stack" &&
      typeof value === "string" &&
      value.length > 200
    ) {
      out[key] = "[truncated]";
      continue;
    }
    out[key] = value;
  }
  return out;
}

function buildEntry(
  level: LogLevel,
  event: string,
  context: InquiryLogContext,
): StructuredLogEntry {
  const environment = process.env.NODE_ENV ?? "development";
  const sanitized = sanitizeLogContext({
    ...context,
    timestamp: new Date().toISOString(),
    level,
    event,
    environment,
  }) as StructuredLogEntry;

  if (environment === "production" && "stack" in sanitized) {
    delete (sanitized as { stack?: string }).stack;
  }

  return sanitized;
}

function write(level: LogLevel, entry: StructuredLogEntry) {
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export const logger = {
  info(event: string, context: InquiryLogContext) {
    write("info", buildEntry("info", event, context));
  },
  warn(event: string, context: InquiryLogContext) {
    write("warn", buildEntry("warn", event, context));
  },
  error(event: string, context: InquiryLogContext) {
    write("error", buildEntry("error", event, context));
  },
};

export function nowMs(): number {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

export function elapsedMs(startedAt: number): number {
  return Math.round(nowMs() - startedAt);
}
