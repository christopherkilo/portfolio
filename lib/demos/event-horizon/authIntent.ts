/**
 * Auth intent helpers — survive OAuth redirects via sessionStorage.
 * Pure functions are unit-tested without mounting React.
 */

export type AuthProviderId = "google" | "github";

export type AuthIntent =
  | { type: "favorite"; eventId: string; eventSlug?: string }
  | {
      type: "reserve";
      eventId: string;
      eventSlug: string;
      ticketTypeId?: string;
      quantity?: number;
    }
  | { type: "navigate"; href: string };

export const AUTH_INTENT_STORAGE_KEY = "eh-auth-intent";

export function serializeAuthIntent(intent: AuthIntent): string {
  return JSON.stringify(intent);
}

export function parseAuthIntent(raw: string | null): AuthIntent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as AuthIntent;
    if (!value || typeof value !== "object" || !("type" in value)) return null;
    if (value.type === "favorite" && typeof value.eventId === "string") {
      return value;
    }
    if (
      value.type === "reserve" &&
      typeof value.eventId === "string" &&
      typeof value.eventSlug === "string"
    ) {
      return value;
    }
    if (value.type === "navigate" && typeof value.href === "string") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAuthIntent(intent: AuthIntent): void {
  try {
    sessionStorage.setItem(
      AUTH_INTENT_STORAGE_KEY,
      serializeAuthIntent(intent),
    );
  } catch {
    /* private mode / unavailable storage */
  }
}

export function loadAuthIntent(): AuthIntent | null {
  try {
    return parseAuthIntent(sessionStorage.getItem(AUTH_INTENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearAuthIntent(): void {
  try {
    sessionStorage.removeItem(AUTH_INTENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function providerLabel(provider: AuthProviderId | null | undefined): string {
  if (provider === "google") return "Google";
  if (provider === "github") return "GitHub";
  return "Account";
}

export function firstNameFromDisplayName(name: string | null | undefined): string {
  if (!name?.trim()) return "";
  return name.trim().split(/\s+/)[0] ?? "";
}

export function friendlySignInError(error: unknown): string {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    message.includes("popup") ||
    message.includes("closed") ||
    message.includes("cancel")
  ) {
    return "Sign-in was cancelled. You can try again when you are ready.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "We could not reach the sign-in provider. Check your connection and try again.";
  }
  if (message.includes("access_denied") || message.includes("oauth")) {
    return "That sign-in provider is unavailable right now. Try another option.";
  }
  return "We could not complete sign-in. Please try again.";
}
