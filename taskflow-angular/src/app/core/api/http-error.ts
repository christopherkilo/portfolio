import { HttpErrorResponse } from "@angular/common/http";
import { TaskflowApiError } from "./envelope";

export type UserFacingLoadError = {
  title: string;
  message: string;
  status: number;
  code: string;
};

function envelopeFrom(error: HttpErrorResponse): {
  message?: string;
  code?: string;
} {
  const body = error.error as
    | { error?: { message?: string; code?: string } }
    | null
    | undefined;
  return {
    message: body?.error?.message,
    code: body?.error?.code,
  };
}

export function userFacingLoadError(error: unknown): UserFacingLoadError {
  if (error instanceof TaskflowApiError) {
    return classify(error.status, error.code, error.message);
  }
  if (error instanceof HttpErrorResponse) {
    const extracted = envelopeFrom(error);
    return classify(
      error.status,
      extracted.code ?? (error.status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR"),
      extracted.message,
    );
  }
  if (error instanceof Error) {
    return classify(500, "INTERNAL_ERROR", error.message);
  }
  return classify(500, "INTERNAL_ERROR", undefined);
}

function classify(
  status: number,
  code: string,
  rawMessage: string | undefined,
): UserFacingLoadError {
  const schema =
    code === "SCHEMA_NOT_READY" ||
    /database tables are missing|Apply the SQL migrations/i.test(rawMessage ?? "");
  if (schema) {
    return {
      title: "Database not set up yet",
      message:
        rawMessage ??
        "TaskFlow tables are missing. Apply the SQL migrations, then retry.",
      status,
      code,
    };
  }
  if (status === 403 || code === "FORBIDDEN" || code === "AUDIT_ACCESS_DENIED") {
    return {
      title: "You don’t have access",
      message: rawMessage ?? "You are not allowed to view this.",
      status,
      code,
    };
  }
  if (status === 404 || code === "NOT_FOUND") {
    return {
      title: "Not found",
      message: rawMessage ?? "That record is gone or was never here.",
      status,
      code,
    };
  }
  if (status === 401 || code === "UNAUTHORIZED") {
    return {
      title: "Sign in required",
      message: "Please sign in to continue.",
      status,
      code,
    };
  }
  return {
    title: "Couldn’t load workspace",
    message:
      rawMessage && !looksLikeInternal(rawMessage)
        ? rawMessage
        : "Check your connection, then try again.",
    status,
    code,
  };
}

function looksLikeInternal(message: string): boolean {
  return /stack|exception|at\s+\w+\s+\(|ECONNREFUSED|prisma/i.test(message);
}
