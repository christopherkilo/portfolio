import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth";
import { safeAngularNextPath } from "./safe-next-path";

/**
 * Sends already-authenticated users away from /signin.
 * Honors a safe `next` (including `/invite?token=`) so invite continuation
 * is not dropped. Not applied to /invite.
 */
export const guestGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureInitialized();
  if (auth.isAuthenticated()) {
    const next = safeAngularNextPath(route.queryParamMap.get("next"));
    return router.parseUrl(next);
  }
  return true;
};
