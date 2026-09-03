import { HttpErrorResponse } from "@angular/common/http";
import { TaskflowApiError } from "./envelope";
import { isStaleVersionError } from "./http-rx";

export type MutationErrorKind =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "server";

export type UserFacingMutationError = {
  kind: MutationErrorKind;
  message: string;
  fieldErrors: Record<string, string[]>;
  status: number;
  code: string;
};

export function userFacingMutationError(error: unknown): UserFacingMutationError {
  if (
    error instanceof TaskflowApiError &&
    INVITE_CONFLICT_CODES.has(error.code)
  ) {
    return classifyMutation(
      error.status,
      error.code,
      error.message,
      error.fieldErrors,
    );
  }
  if (isStaleVersionError(error)) {
    return {
      kind: "conflict",
      message:
        error.message || "This item changed while you were editing it.",
      fieldErrors: error.fieldErrors,
      status: error.status,
      code: error.code,
    };
  }
  if (error instanceof TaskflowApiError) {
    return classifyMutation(error.status, error.code, error.message, error.fieldErrors);
  }
  if (error instanceof HttpErrorResponse) {
    const body = error.error as {
      error?: { message?: string; code?: string; fieldErrors?: Record<string, string[]> };
    } | null;
    return classifyMutation(
      error.status,
      body?.error?.code ?? (error.status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR"),
      body?.error?.message,
      body?.error?.fieldErrors ?? {},
    );
  }
  return classifyMutation(500, "INTERNAL_ERROR", undefined, {});
}

function looksLikeInternal(message: string): boolean {
  return /stack|exception|at\s+\w+\s+\(|ECONNREFUSED|prisma/i.test(message);
}

const INVITE_CONFLICT_CODES = new Set([
  "INVITATION_EXPIRED",
  "INVITATION_ALREADY_ACCEPTED",
  "INVITATION_ALREADY_PENDING",
  "ACTIVE_INVITATION_EXISTS",
  "CONFLICT",
]);

function classifyMutation(
  status: number,
  code: string,
  rawMessage: string | undefined,
  fieldErrors: Record<string, string[]>,
): UserFacingMutationError {
  if (status === 400 || code === "VALIDATION_ERROR") {
    return {
      kind: "validation",
      message: rawMessage || "Check the highlighted fields and try again.",
      fieldErrors,
      status,
      code,
    };
  }
  if (status === 401 || code === "UNAUTHORIZED") {
    return {
      kind: "unauthorized",
      message: "Please sign in to continue.",
      fieldErrors,
      status,
      code,
    };
  }
  if (status === 503 || code === "OFFLINE_UNSAFE_ACTION") {
    return {
      kind: "server",
      message: rawMessage || "This action needs an active connection.",
      fieldErrors,
      status,
      code,
    };
  }
  if (
    status === 403 ||
    code === "FORBIDDEN" ||
    code === "INVALID_ROLE_CHANGE" ||
    code === "ROLE_ESCALATION_FORBIDDEN" ||
    code === "OWNER_REMOVAL_FORBIDDEN"
  ) {
    return {
      kind: "forbidden",
      message: rawMessage || "You don’t have permission to do that.",
      fieldErrors,
      status,
      code,
    };
  }
  if (status === 404 || code === "NOT_FOUND" || code === "MEMBER_NOT_FOUND") {
    return {
      kind: "not_found",
      message: rawMessage || "This item is no longer available.",
      fieldErrors,
      status,
      code,
    };
  }
  if (status === 409 || code === "STALE_VERSION" || INVITE_CONFLICT_CODES.has(code)) {
    const stale = code === "STALE_VERSION";
    return {
      kind: "conflict",
      message:
        rawMessage ||
        (stale
          ? "This item changed while you were editing it."
          : "This invitation cannot be used."),
      fieldErrors,
      status,
      code,
    };
  }
  return {
    kind: "server",
    message:
      rawMessage && !looksLikeInternal(rawMessage)
        ? rawMessage
        : "Couldn’t save. Check your connection, then try again.",
    fieldErrors,
    status,
    code,
  };
}
