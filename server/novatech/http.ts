import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  ConfigurationError,
  DuplicateSubmissionError,
  InvalidJsonError,
  NovatechError,
  RateLimitError,
  TurnstileError,
  UnexpectedInquiryError,
  ValidationError,
} from "@/server/novatech/errors";
import { EnvMissingError } from "@/server/novatech/env";
import type { InquiryApiSuccessData } from "@/lib/demos/novatech/inquiry/apiContract";
import {
  logger,
  type InquiryLogContext,
} from "@/server/novatech/logger";
import { REQUEST_ID_HEADER } from "@/server/novatech/requestId";

function responseHeaders(requestId: string): HeadersInit {
  return {
    "Cache-Control": "no-store",
    [REQUEST_ID_HEADER]: requestId,
  };
}

export function jsonInquiryCreated(
  data: InquiryApiSuccessData,
  requestId: string,
) {
  return NextResponse.json(
    { success: true as const, data },
    { status: 201, headers: responseHeaders(requestId) },
  );
}

export function jsonInquiryError(error: NovatechError, requestId: string) {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: error.code,
        message: error.expose
          ? error.message
          : "We couldn’t submit your inquiry right now. Your entries have been preserved.",
        fieldErrors: error.fieldErrors,
        requestId,
      },
    },
    { status: error.status, headers: responseHeaders(requestId) },
  );
}

export function toNovatechError(
  error: unknown,
  context: Pick<InquiryLogContext, "requestId" | "submissionId">,
): NovatechError {
  if (error instanceof NovatechError) {
    if (!error.alreadyLogged && error.code === "INQUIRY_FAILED") {
      logger.error("inquiry.failed", {
        ...context,
        integration: "route",
        route: "/api/novatech/inquiries",
        errorCode: error.code,
        status: "unexpected",
      });
      error.alreadyLogged = true;
    }
    return error;
  }

  if (error instanceof EnvMissingError) {
    logger.error("inquiry.failed", {
      ...context,
      integration: "config",
      route: "/api/novatech/inquiries",
      errorCode: "CONFIGURATION_ERROR",
      status: "missing_env",
    });
    return new ConfigurationError(undefined, { alreadyLogged: true });
  }

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = String(issue.path[0] ?? "_root");
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    const turnstileIssue = fieldErrors.turnstileToken;
    if (turnstileIssue && Object.keys(fieldErrors).length === 1) {
      return new TurnstileError("TURNSTILE_REQUIRED", turnstileIssue);
    }
    return new ValidationError(
      "Please check the highlighted fields.",
      fieldErrors,
    );
  }

  logger.error("inquiry.failed", {
    ...context,
    integration: "route",
    route: "/api/novatech/inquiries",
    errorCode: "INQUIRY_FAILED",
    status: "unexpected",
    failureType: error instanceof Error ? error.name : "unknown",
    stack:
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.stack
        : undefined,
  });

  return new UnexpectedInquiryError(undefined, { alreadyLogged: true });
}

export async function readInquiryJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new InvalidJsonError(
      "Content-Type must be application/json.",
    );
  }

  const raw = await request.text();
  if (raw.length > 50_000) {
    throw new InvalidJsonError("Request body is too large.");
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new InvalidJsonError();
  }
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export {
  DuplicateSubmissionError,
  RateLimitError,
  TurnstileError,
  ValidationError,
};
