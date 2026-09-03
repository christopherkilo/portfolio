import { HttpInterceptorFn } from "@angular/common/http";

/** Same-origin cookie session (Option A). No Authorization header. */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ withCredentials: true }));
