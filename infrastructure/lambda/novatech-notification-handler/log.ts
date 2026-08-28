const ALLOWED_KEYS = new Set([
  "event",
  "requestId",
  "submissionId",
  "notificationId",
  "notificationType",
  "integration",
  "operation",
  "status",
  "durationMs",
  "httpStatus",
  "failureType",
  "errorCode",
  "receiveCount",
  "messageId",
]);

const FORBIDDEN_VALUE_PATTERN =
  /(bearer\s+[a-z0-9._-]+|pat-[a-z0-9-]+|sk_live|re_[a-z0-9]+|turnstile|password=)/i;

export function sanitizeNotificationLog(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (value === undefined) continue;
    if (typeof value === "string" && FORBIDDEN_VALUE_PATTERN.test(value)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function logNotificationEvent(
  event: string,
  fields: Record<string, unknown>,
): void {
  console.log(
    JSON.stringify(
      sanitizeNotificationLog({
        event,
        integration: "resend",
        ...fields,
      }),
    ),
  );
}
