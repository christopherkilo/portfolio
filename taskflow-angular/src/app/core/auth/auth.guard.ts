import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth";
import { safeAngularNextPath } from "./safe-next-path";

/**
 * UX only. RLS and server/taskflow remain authoritative.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureInitialized();
  if (auth.isAuthenticated()) {
    return true;
  }
  const next = safeAngularNextPath(state.url);
  return router.createUrlTree(["/signin"], { queryParams: { next } });
};
