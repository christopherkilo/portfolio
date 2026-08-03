import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, UnexpectedError, ValidationError } from "@/server/errors/AppError";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors: Record<string, string[]>;
  };
};

/**
 * Validation strategy:
 * - 400: malformed JSON / unreadable body
 * - 422: well-formed JSON that fails Zod field rules
 */
export function jsonSuccess<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(
    { success: true, data } satisfies ApiSuccess<T>,
    { status: init?.status ?? 200 },
  );
}

export function jsonCreated<T>(data: T) {
  return jsonSuccess(data, { status: 201 });
}

export function jsonNoContent() {
  return new NextResponse(null, { status: 204 });
}

export function jsonError(error: AppError) {
  const body: ApiErrorBody = {
    success: false,
    error: {
      code: error.code,
      message: error.expose
        ? error.message
        : "We could not complete your request. Please try again.",
      fieldErrors: error.fieldErrors,
    },
  };
  return NextResponse.json(body, { status: error.status });
}

export function zodToValidationError(error: ZodError): ValidationError {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    fieldErrors[path] ??= [];
    fieldErrors[path].push(issue.message);
  }
  return new ValidationError("Request validation failed.", fieldErrors);
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) return zodToValidationError(error);
  console.error("[event-horizon-api]", {
    category: "unexpected",
    message: error instanceof Error ? error.message : "unknown",
  });
  return new UnexpectedError();
}

export function handleRouteError(error: unknown) {
  return jsonError(toAppError(error));
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be valid JSON.", {
      status: 400,
    });
  }
}
