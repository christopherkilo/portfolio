import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  InternalError,
  StaleVersionError,
  TaskflowError,
  ValidationError,
} from "@/server/taskflow/errors";
import { TaskflowEnvError } from "@/server/taskflow/supabase/env";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors: Record<string, string[]>;
  };
  data?: { latest: unknown };
};

export function jsonSuccess<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(
    { success: true, data } satisfies ApiSuccess<T>,
    { status: init?.status ?? 200 },
  );
}

export function jsonCreated<T>(data: T) {
  return jsonSuccess(data, { status: 201 });
}

export function jsonError(error: TaskflowError) {
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
  if (error instanceof StaleVersionError) {
    body.data = { latest: error.latest };
  }
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

export function toTaskflowError(error: unknown): TaskflowError {
  if (error instanceof TaskflowError) return error;
  if (error instanceof ZodError) return zodToValidationError(error);
  if (error instanceof TaskflowEnvError) {
    return new InternalError(
      "TaskFlow backend is not configured. Check Supabase environment variables.",
    );
  }
  console.error("[taskflow-api]", {
    message: error instanceof Error ? error.message : "unknown",
  });
  return new InternalError();
}

export function handleTaskflowRouteError(error: unknown) {
  return jsonError(toTaskflowError(error));
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}
