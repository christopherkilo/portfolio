import { HttpContextToken } from "@angular/common/http";

/** Skip 401 → sign-in redirect (used for the session probe). */
export const SKIP_AUTH_REDIRECT = new HttpContextToken(() => false);
