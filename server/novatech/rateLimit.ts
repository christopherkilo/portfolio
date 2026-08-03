import "server-only";

import { RateLimitError } from "@/server/novatech/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * Best-effort in-memory rate limiter.
 *
 * Limitation: instance-local only. Not suitable as the sole control for
 * multi-instance production. Replace later with Upstash Redis, Cloudflare,
 * or an edge limiter without changing call sites.
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
