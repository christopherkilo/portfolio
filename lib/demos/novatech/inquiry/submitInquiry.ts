import type {
  InquiryFieldErrors,
  InquiryInput,
  InquirySubmitResult,
  SubmitInquiryOptions,
} from "@/lib/demos/novatech/inquiry/types";
import type { InquiryApiResponse } from "@/lib/demos/novatech/inquiry/apiContract";
import { INQUIRY_SERVICE_OPTIONS } from "@/lib/demos/novatech/inquiry/types";

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Client submission boundary for NovaTech inquiries.
 * Posts to POST /api/novatech/inquiries — does not log inquiry payloads.
 */
export async function submitInquiry(
  data: InquiryInput,
  options: SubmitInquiryOptions = {},
): Promise<InquirySubmitResult> {
  if (
    options.forceFailure &&
    process.env.NODE_ENV !== "production"
  ) {
    if (options.delayMs) {
      await wait(options.delayMs);
    }
    return {
      ok: false,
      retryable: true,
      code: "INQUIRY_FAILED",
      message:
        "We couldn’t submit your inquiry right now. Your entries have been preserved.",
    };
  }

  const turnstileToken = options.turnstileToken?.trim() ?? "";
  if (!turnstileToken) {
    return {
      ok: false,
      retryable: true,
      code: "TURNSTILE_REQUIRED",
      message: "Please verify that you’re human and try again.",
    };
  }

  const submissionId =
    options.submissionId?.trim() ||
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/novatech/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        ...data,
        turnstileToken,
        submissionId,
      }),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | InquiryApiResponse
      | null;

    if (!payload || typeof payload !== "object") {
      return {
        ok: false,
        retryable: true,
        code: "INQUIRY_FAILED",
        message:
          "We couldn’t submit your inquiry right now. Your entries have been preserved.",
      };
    }

    if (payload.success) {
      const selected = payload.data.selectedService;
      const selectedService = (
        INQUIRY_SERVICE_OPTIONS as readonly string[]
      ).includes(selected)
        ? (selected as InquiryInput["selectedService"])
        : data.selectedService;

      return {
        ok: true,
        selectedService,
        inquiryId: payload.data.inquiryId,
        emailSent: payload.data.emailSent,
      };
    }

    const fieldErrors = mapFieldErrors(payload.error.fieldErrors);
    return {
      ok: false,
      retryable: isRetryable(payload.error.code),
      code: payload.error.code,
      message: payload.error.message,
      fieldErrors,
    };
  } catch {
    return {
      ok: false,
      retryable: true,
      code: "INQUIRY_FAILED",
      message:
        "We couldn’t submit your inquiry right now. Your entries have been preserved.",
    };
  } finally {
    clearTimeout(timer);
  }
}

function mapFieldErrors(
  fieldErrors: Record<string, string> | undefined,
): InquiryFieldErrors | undefined {
  if (!fieldErrors) return undefined;
  const mapped: InquiryFieldErrors = {};
  for (const [key, message] of Object.entries(fieldErrors)) {
    if (key in dataKeys) {
      mapped[key as keyof InquiryInput] = message;
    }
  }
  return Object.keys(mapped).length ? mapped : undefined;
}

const dataKeys: Record<keyof InquiryInput, true> = {
  name: true,
  businessEmail: true,
  phone: true,
  company: true,
  jobTitle: true,
  selectedService: true,
  companySize: true,
  currentEnvironment: true,
  urgency: true,
  preferredContactMethod: true,
  message: true,
  consent: true,
};

function isRetryable(code: string): boolean {
  return ![
    "VALIDATION_ERROR",
    "INVALID_JSON",
    "DUPLICATE_SUBMISSION",
  ].includes(code);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
