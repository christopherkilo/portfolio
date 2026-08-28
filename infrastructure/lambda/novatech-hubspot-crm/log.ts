const ALLOWED_KEYS = new Set([
  "event",
  "requestId",
  "submissionId",
  "integration",
  "operation",
  "status",
  "durationMs",
  "httpStatus",
  "contactId",
  "dealId",
  "noteId",
  "contactCreated",
  "dealCreated",
  "noteCreated",
  "failureType",
  "errorCode",
  "selectedService",
  "urgency",
  "phoneProvided",
]);

const FORBIDDEN_VALUE_PATTERN =
  /(bearer\s+[a-z0-9._-]+|pat-[a-z0-9-]+|sk_live|re_[a-z0-9]+|turnstile|password=)/i;

export function sanitizeHubSpotLog(fields: Record<string, unknown>): Record<string, unknown> {
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

export function logHubSpotEvent(event: string, fields: Record<string, unknown>): void {
  console.log(
    JSON.stringify(
      sanitizeHubSpotLog({
        event,
        integration: "hubspot",
        ...fields,
      }),
    ),
  );
}