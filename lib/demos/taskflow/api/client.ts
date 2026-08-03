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

export async function taskflowFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });

  if (response.status === 204) return undefined as T;

  const body = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!response.ok || !body.success) {
    const failure = body as ApiFailure;
    throw new TaskflowApiError(
      failure.error?.message ?? "Request failed.",
      {
        status: response.status,
        code: failure.error?.code ?? "INTERNAL_ERROR",
        fieldErrors: failure.error?.fieldErrors,
        data: failure.data,
      },
    );
  }
  return body.data;
}
