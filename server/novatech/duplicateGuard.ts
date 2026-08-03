import "server-only";

import { DuplicateSubmissionError } from "@/server/novatech/errors";

type Entry = {
  expiresAt: number;
};

/**
 * Short-lived in-memory duplicate guard keyed by client submissionId.
 *
 * Limitation: instance-local. Does not provide exact-once delivery across
 * multiple server instances or restarts. Complements client pending-state
 * and HubSpot note tagging — does not replace durable idempotency storage.
 */
const recent = new Map<string, Entry>();
const TTL_MS = 10 * 60 * 1000;

function prune(now: number) {
  for (const [id, entry] of recent) {
    if (entry.expiresAt <= now) recent.delete(id);
  }
}

export function assertFreshSubmissionId(submissionId: string): void {
  const now = Date.now();
  prune(now);
  const existing = recent.get(submissionId);
  if (existing && existing.expiresAt > now) {
    throw new DuplicateSubmissionError();
  }
  recent.set(submissionId, { expiresAt: now + TTL_MS });
}

export function releaseSubmissionId(submissionId: string): void {
  recent.delete(submissionId);
}

export function __resetDuplicateGuardForTests() {
  recent.clear();
}
