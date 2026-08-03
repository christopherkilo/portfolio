import "server-only";

import { randomUUID } from "node:crypto";

/**
 * Strict UUID validation for incoming `x-request-id`.
 * Malformed / untrusted values are replaced — never treated as a security token.
 */
const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidRequestId(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 36 && REQUEST_ID_PATTERN.test(trimmed);
}

/**
 * Accept a valid incoming `x-request-id`, otherwise generate a new UUID.
 */
export function resolveRequestId(headerValue: string | null | undefined): string {
  const candidate = headerValue?.trim() ?? "";
  if (candidate && isValidRequestId(candidate)) {
    return candidate.toLowerCase();
  }
  return randomUUID();
}

export const REQUEST_ID_HEADER = "x-request-id";
