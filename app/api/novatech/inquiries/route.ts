import { inquiryApiRequestSchema } from "@/lib/demos/novatech/inquiry/schema";
import { assertInquiryRateLimit } from "@/server/novatech/rateLimit";
import { processInquiry } from "@/server/novatech/services/inquiryService";
import {
  clientIpFromRequest,
  jsonInquiryAccepted,
  jsonInquiryError,
  readInquiryJson,
  toNovatechError,
} from "@/server/novatech/http";
import { logger } from "@/server/novatech/logger";
import {
  REQUEST_ID_HEADER,
  resolveRequestId,
} from "@/server/novatech/requestId";
import {
  RateLimitError,
  TurnstileError,
  ValidationError,
} from "@/server/novatech/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
  let submissionId: string | undefined;

  logger.info("inquiry.request.received", {
    requestId,
    integration: "route",
    route: "/api/novatech/inquiries",
  });

  try {
    const remoteIp = clientIpFromRequest(request);

    try {
      assertInquiryRateLimit(`novatech-inquiry:${remoteIp}`);
    } catch (error) {
      if (error instanceof RateLimitError) {
        logger.warn("inquiry.rate_limit.rejected", {
          requestId,
          integration: "route",
          route: "/api/novatech/inquiries",
          errorCode: "RATE_LIMITED",
          status: "rejected",
        });
        error.alreadyLogged = true;
      }
      throw error;
    }

    const body = await readInquiryJson(request);
    const parsed = inquiryApiRequestSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "_root");
        if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
      }

      const isTurnstileOnly =
        Boolean(fieldErrors.turnstileToken) &&
        Object.keys(fieldErrors).length === 1;

      logger.warn("inquiry.validation.failed", {
        requestId,
        integration: "route",
        route: "/api/novatech/inquiries",
        errorCode: isTurnstileOnly ? "TURNSTILE_REQUIRED" : "VALIDATION_ERROR",
        status: "rejected",
      });

      if (isTurnstileOnly) {
        throw new TurnstileError(
          "TURNSTILE_REQUIRED",
          fieldErrors.turnstileToken,
          { alreadyLogged: true },
        );
      }

      const validationError = new ValidationError(
        "Please check the highlighted fields.",
        fieldErrors,
      );
      validationError.alreadyLogged = true;
      throw validationError;
    }

    submissionId = parsed.data.submissionId;

    const result = await processInquiry({
      request: parsed.data,
      remoteIp: remoteIp === "unknown" ? undefined : remoteIp,
      requestId,
    });

    return jsonInquiryAccepted(
      {
        inquiryId: result.inquiryId,
        accepted: result.accepted,
        selectedService: result.selectedService,
      },
      requestId,
    );
  } catch (error) {
    return jsonInquiryError(
      toNovatechError(error, { requestId, submissionId }),
      requestId,
    );
  }
}
