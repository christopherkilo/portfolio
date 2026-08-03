import "server-only";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVENTORY_ERROR"
  | "TICKET_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;
  readonly expose: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      status: number;
      fieldErrors?: Record<string, string[]>;
      expose?: boolean;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.status = options.status;
    this.fieldErrors = options.fieldErrors ?? {};
    this.expose = options.expose ?? true;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super("VALIDATION_ERROR", message, { status: 422, fieldErrors });
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Please sign in to continue.") {
    super("UNAUTHORIZED", message, { status: 401 });
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super("FORBIDDEN", message, { status: 403 });
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super("NOT_FOUND", message, { status: 404 });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode = "CONFLICT") {
    super(code, message, { status: 409 });
    this.name = "ConflictError";
  }
}

export class InventoryError extends AppError {
  constructor(message: string) {
    super("INVENTORY_ERROR", message, { status: 409 });
    this.name = "InventoryError";
  }
}

export class UnexpectedError extends AppError {
  constructor(message = "We could not complete your request. Please try again.") {
    super("INTERNAL_ERROR", message, { status: 500, expose: true });
    this.name = "UnexpectedError";
  }
}
