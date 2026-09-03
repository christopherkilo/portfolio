import { HttpErrorResponse } from "@angular/common/http";
import { TaskflowApiError } from "../api/envelope";

/** Browser reachability only. Not Realtime health. */
export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Genuine transport failure. A server status (including 500) is not offline.
 */
export function isTransportFailure(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 0;
  }
  if (error instanceof TaskflowApiError) {
    return error.status === 0;
  }
  if (error instanceof TypeError) return true;
  return false;
}

const SECRET_KEY =
  /^(access_token|refresh_token|password|cookie|authorization|service_role|secret|supabase_secret_key)$/i;

export function assertSafeQueuePayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SECRET_KEY.test(key)) {
      throw new Error("Offline queue payload cannot include credentials.");
    }
    if (key === "expectedVersion") continue;
    next[key] = value;
  }
  return next;
}

export function assigneeListsDiffer(
  previousIds: string[],
  nextIds: string[],
): boolean {
  if (previousIds.length !== nextIds.length) return true;
  const prev = [...previousIds].sort();
  const next = [...nextIds].sort();
  return prev.some((id, index) => id !== next[index]);
}
