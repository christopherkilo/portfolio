import "server-only";

import { getTurnstileRuntimeConfig } from "@/server/novatech/env";
import {
  ConfigurationError,
  TurnstileError,
} from "@/server/novatech/errors";
import {
  elapsedMs,
  logger,
  nowMs,
  type InquiryLogContext,
} from "@/server/novatech/logger";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 8_000;

type SiteverifyResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export type TurnstileVerifyInput = {
  token: string;
  remoteIp?: string;
  context: Pick<InquiryLogContext, "requestId" | "submissionId">;
};

/**
 * Verify a Turnstile token with Cloudflare Siteverify.
 * Never logs the secret or full token.
 */
export async function verifyTurnstileToken(
  input: TurnstileVerifyInput,
): Promise<void> {
  const base = {
    requestId: input.context.requestId,
    submissionId: input.context.submissionId,
    integration: "turnstile" as const,
  };

  logger.info("turnstile.verification.started", base);

  const started = nowMs();
  const config = getTurnstileRuntimeConfig();

  if (config.allowDevBypass && input.token === "dev-mock-token") {
    logger.info("turnstile.verification.succeeded", {
      ...base,
      status: "dev_bypass",
      durationMs: elapsedMs(started),
    });
    return;
  }

  if (!config.secret) {
    logger.warn("turnstile.verification.failed", {
      ...base,
      status: "missing_secret",
      errorCode:
        config.nodeEnv === "production"
          ? "CONFIGURATION_ERROR"
          : "TURNSTILE_REQUIRED",
      durationMs: elapsedMs(started),
    });
    if (config.nodeEnv === "production") {
      throw new ConfigurationError(undefined, { alreadyLogged: true });
    }
    throw new TurnstileError("TURNSTILE_REQUIRED", undefined, {
      alreadyLogged: true,
    });
  }

  if (!input.token.trim()) {
    logger.warn("turnstile.verification.failed", {
      ...base,
      status: "missing_token",
      errorCode: "TURNSTILE_REQUIRED",
      durationMs: elapsedMs(started),
    });
    throw new TurnstileError("TURNSTILE_REQUIRED", undefined, {
      alreadyLogged: true,
    });
  }

  const body = new URLSearchParams();
  body.set("secret", config.secret);
  body.set("response", input.token);
  if (input.remoteIp) body.set("remoteip", input.remoteIp);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let payload: SiteverifyResponse;
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn("turnstile.verification.failed", {
        ...base,
        status: "unavailable",
        httpStatus: response.status,
        errorCode: "TURNSTILE_FAILED",
        durationMs: elapsedMs(started),
      });
      throw new TurnstileError("TURNSTILE_FAILED", undefined, {
        alreadyLogged: true,
      });
    }

    payload = (await response.json()) as SiteverifyResponse;
  } catch (error) {
    if (error instanceof TurnstileError) throw error;
    logger.warn("turnstile.verification.failed", {
      ...base,
      status: "timeout_or_network",
      errorCode: "TURNSTILE_FAILED",
      failureType: error instanceof Error ? error.name : "unknown",
      durationMs: elapsedMs(started),
    });
    throw new TurnstileError("TURNSTILE_FAILED", undefined, {
      alreadyLogged: true,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!payload.success) {
    const codes = payload["error-codes"]?.join(",") ?? "unknown";
    logger.warn("turnstile.verification.failed", {
      ...base,
      status: "rejected",
      errorCode: "TURNSTILE_FAILED",
      errorCodes: codes,
      durationMs: elapsedMs(started),
    });
    throw new TurnstileError("TURNSTILE_FAILED", undefined, {
      alreadyLogged: true,
    });
  }

  logger.info("turnstile.verification.succeeded", {
    ...base,
    status: "ok",
    hostname: payload.hostname,
    durationMs: elapsedMs(started),
  });
}
