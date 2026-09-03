import { HttpErrorResponse } from "@angular/common/http";
import { catchError, throwError, type OperatorFunction } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  TaskflowApiError,
} from "./envelope";

export function catchTaskflowHttp<T>(): OperatorFunction<T, T> {
  return catchError((error: unknown) => {
    if (error instanceof TaskflowApiError) {
      return throwError(() => error);
    }
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiSuccess<never> | ApiFailure | null;
      return throwError(
        () =>
          new TaskflowApiError(
            (body && "error" in body && body.error?.message) ||
              error.message ||
              "Request failed.",
            {
              status: error.status,
              code:
                (body && "error" in body && body.error?.code) ||
                (error.status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR"),
              fieldErrors:
                (body && "error" in body && body.error?.fieldErrors) || {},
              data: body && "data" in body ? body.data : undefined,
            },
          ),
      );
    }
    return throwError(() => error);
  });
}

export function isStaleVersionError(error: unknown): error is TaskflowApiError {
  return (
    error instanceof TaskflowApiError &&
    (error.status === 409 || error.code === "STALE_VERSION")
  );
}
