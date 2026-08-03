import type { PublicEvent, PublicReservation } from "@/server/mappers/eventHorizon";

export type ApiError = {
  code: string;
  message: string;
  fieldErrors: Record<string, string[]>;
};

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: ApiError; status: number };

async function parseResponse<T>(response: Response): Promise<ApiResult<T>> {
  if (response.status === 204) {
    return { ok: true, data: undefined as T, status: 204 };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      status: response.status,
      error: {
        code: "INTERNAL_ERROR",
        message: "We could not complete your request. Please try again.",
        fieldErrors: {},
      },
    };
  }

  const body = payload as {
    success?: boolean;
    data?: T;
    error?: ApiError;
  };

  if (response.ok && body.success) {
    return { ok: true, data: body.data as T, status: response.status };
  }

  return {
    ok: false,
    status: response.status,
    error: body.error ?? {
      code: "INTERNAL_ERROR",
      message: "We could not complete your request. Please try again.",
      fieldErrors: {},
    },
  };
}

export async function apiGet<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    method: "GET",
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  return parseResponse<T>(response);
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(path, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseResponse<T>(response);
}

export type EventsListResponse = {
  items: PublicEvent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  filters: Record<string, unknown>;
};

export type ReservationsListResponse = {
  items: PublicReservation[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type { PublicEvent, PublicReservation };
