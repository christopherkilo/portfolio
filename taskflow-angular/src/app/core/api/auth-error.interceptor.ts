import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthService } from "../auth/auth";
import { SKIP_AUTH_REDIRECT } from "./http-context";

/**
 * 401 only. 403 / 409 / 5xx pass through unchanged.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.context.get(SKIP_AUTH_REDIRECT)
      ) {
        auth.handleUnauthorized(router.url);
      }
      return throwError(() => error);
    }),
  );
};
