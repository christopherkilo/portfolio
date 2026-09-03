import { TaskflowApiError } from "../api/envelope";
import {
  OFFLINE_UNSAFE_CODE,
  OFFLINE_UNSAFE_MESSAGE,
} from "./policy";
import { isBrowserOffline } from "./transport";

export function offlineUnsafeError(
  message = OFFLINE_UNSAFE_MESSAGE,
): TaskflowApiError {
  return new TaskflowApiError(message, {
    status: 503,
    code: OFFLINE_UNSAFE_CODE,
  });
}

export function assertOnlineForUnsafeAction(
  _action: string,
  message = OFFLINE_UNSAFE_MESSAGE,
): void {
  if (isBrowserOffline()) {
    throw offlineUnsafeError(message);
  }
}
