import "server-only";

export type NovatechErrorCode =
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "TURNSTILE_REQUIRED"
  | "TURNSTILE_FAILED"
  | "RATE_LIMITED"
  | "CRM_UNAVAILABLE"
  | "EMAIL_UNAVAILABLE"
  | "INQUIRY_FAILED"
  | "CONFIGURATION_ERROR"
  | "DUPLICATE_SUBMISSION";

export class NovatechError extends Error {
  readonly code: NovatechErrorCode;
  readonly status: number;
  readonly fieldErrors: Record<string, string>;
  readonly expose: boolean;
  /** When true, Route Handler skips a second unexpected-error log. */
  alreadyLogged: boolean;

  constructor(
    code: NovatechErrorCode,
    message: string,
    options: {
      status: number;
      fieldErrors?: Record<string, string>;
      expose?: boolean;
      cause?: unknown;
      alreadyLogged?: boolean;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "NovatechError";
    this.code = code;
    this.status = options.status;
    this.fieldErrors = options.fieldErrors ?? {};
    this.expose = options.expose ?? true;
    this.alreadyLogged = options.alreadyLogged ?? false;
  }
}

export class ValidationError extends NovatechError {
  constructor(
    message = "Please check the highlighted fields.",
    fieldErrors: Record<string, string> = {},
  ) {
    super("VALIDATION_ERROR", message, { status: 422, fieldErrors });
    this.name = "ValidationError";
  }
}

export class InvalidJsonError extends NovatechError {
  constructor(message = "Request body must be valid JSON.") {
    super("INVALID_JSON", message, { status: 400 });
    this.name = "InvalidJsonError";
  }
}

export class TurnstileError extends NovatechError {
  constructor(
    code: "TURNSTILE_REQUIRED" | "TURNSTILE_FAILED" = "TURNSTILE_FAILED",
    message?: string,
    options: { alreadyLogged?: boolean } = {},
  ) {
    super(code, message ?? "Please verify that you’re human and try again.", {
      status: 403,
      alreadyLogged: options.alreadyLogged,
    });
    this.name = "TurnstileError";
  }
}

export class RateLimitError extends NovatechError {
  constructor(
    message = "Too many inquiries were submitted. Please wait a moment and try again.",
  ) {
    super("RATE_LIMITED", message, { status: 429 });
    this.name = "RateLimitError";
  }
}

export class HubSpotError extends NovatechError {
  constructor(
    message?: string,
    options: {
      status?: number;
      cause?: unknown;
      expose?: boolean;
      alreadyLogged?: boolean;
    } = {},
  ) {
    super(
      "CRM_UNAVAILABLE",
      message ??
        "We couldn’t submit your inquiry right now. Your entries have been preserved.",
      {
        status: options.status ?? 503,
        expose: options.expose ?? true,
        cause: options.cause,
        alreadyLogged: options.alreadyLogged,
      },
    );
    this.name = "HubSpotError";
  }
}

export class EmailError extends NovatechError {
  constructor(
    message?: string,
    options: { cause?: unknown; alreadyLogged?: boolean } = {},
  ) {
    super("EMAIL_UNAVAILABLE", message ?? "Email delivery failed.", {
      status: 503,
      expose: false,
      cause: options.cause,
      alreadyLogged: options.alreadyLogged,
    });
    this.name = "EmailError";
  }
}

export class ConfigurationError extends NovatechError {
  constructor(
    message?: string,
    options: { alreadyLogged?: boolean } = {},
  ) {
    super(
      "CONFIGURATION_ERROR",
      message ??
        "Inquiry service is not configured. Please try again later.",
      {
        status: 503,
        expose: true,
        alreadyLogged: options.alreadyLogged,
      },
    );
    this.name = "ConfigurationError";
  }
}

export class DuplicateSubmissionError extends NovatechError {
  constructor(
    message = "This inquiry was already received. Please wait before submitting again.",
  ) {
    super("DUPLICATE_SUBMISSION", message, { status: 409 });
    this.name = "DuplicateSubmissionError";
  }
}

export class UnexpectedInquiryError extends NovatechError {
  constructor(
    message?: string,
    options: { alreadyLogged?: boolean } = {},
  ) {
    super(
      "INQUIRY_FAILED",
      message ??
        "We couldn’t submit your inquiry right now. Your entries have been preserved.",
      {
        status: 500,
        expose: true,
        alreadyLogged: options.alreadyLogged,
      },
    );
    this.name = "UnexpectedInquiryError";
  }
}
