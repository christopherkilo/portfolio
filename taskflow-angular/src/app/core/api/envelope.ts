export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors: Record<string, string[]>;
  };
  data?: { latest?: unknown };
};

export class TaskflowApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string[]>;
  readonly data?: { latest?: unknown };

  constructor(
    message: string,
    options: {
      status: number;
      code: string;
      fieldErrors?: Record<string, string[]>;
      data?: { latest?: unknown };
    },
  ) {
    super(message);
    this.name = "TaskflowApiError";
    this.status = options.status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors ?? {};
    this.data = options.data;
  }
}

/** Parse a successful JSON body from httpResource. */
export function parseTaskflowEnvelope<T>(raw: unknown): T {
  return unwrapTaskflowEnvelope(raw as ApiSuccess<T> | ApiFailure, 200);
}

export function unwrapTaskflowEnvelope<T>(
  body: ApiSuccess<T> | ApiFailure | null | undefined,
  status: number,
): T {
  if (status === 204) return undefined as T;
  if (body && "success" in body && body.success) {
    return body.data;
  }
  const failure = body as ApiFailure | undefined;
  throw new TaskflowApiError(failure?.error?.message ?? "Request failed.", {
    status,
    code: failure?.error?.code ?? "INTERNAL_ERROR",
    fieldErrors: failure?.error?.fieldErrors ?? {},
    data: failure?.data,
  });
}
