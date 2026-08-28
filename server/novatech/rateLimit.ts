import "server-only";

import { RateLimitError } from "@/server/novatech/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * Best-effort in-memory rate limiter at the public ingress.
 *
 * Limitation: instance-local only. It is not distributed protection and must
 * not be described as such. Cloudflare Turnstile and DynamoDB submission
 * idempotency are the real controls. Kept as a cheap extra guard against
 * noisy retries hitting this instance — not Redis, WAF, or API Gateway.
 */
const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

export function assertInquiryRateLimit(key: string): void {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (existing.count >= MAX_REQUESTS) {
    throw new RateLimitError();
  }

  existing.count += 1;
  buckets.set(key, existing);
}

/** Test helper — clears all buckets. */
export function __resetInquiryRateLimitForTests() {
  buckets.clear();
}
