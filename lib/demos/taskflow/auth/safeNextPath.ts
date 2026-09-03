/**
 * Strict post-login / OAuth `next` allowlist.
 * Rejects open redirects (absolute URLs, protocol-relative, backslash tricks).
 */

export const REACT_TASKFLOW_PREFIX = "/demos/taskflow";

export const ANGULAR_APP_PATHS = [
  "/dashboard",
  "/projects",
  "/tasks",
  "/calendar",
  "/team",
  "/audit",
  "/settings",
] as const;

const DUMMY_ORIGIN = "https://taskflow.invalid";

/** Matches acceptInvitationSchema length and the server's base64url tokens. */
export const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,200}$/;

export function isAngularAppPath(pathname: string): boolean {
  return (ANGULAR_APP_PATHS as readonly string[]).includes(pathname);
}

export function isReactTaskflowPath(pathname: string): boolean {
  return (
    pathname === REACT_TASKFLOW_PREFIX ||
    pathname.startsWith(`${REACT_TASKFLOW_PREFIX}/`)
  );
}

/**
 * Angular `/invite?token=` only. No other query keys, hash, or host.
 * Required so OAuth `next` can return to the same invitation without
 * weakening the rest of the allowlist.
 */
export function safeAngularInvitePath(parsed: URL): string | null {
  if (parsed.pathname !== "/invite") return null;
  if (parsed.username || parsed.password) return null;
  if (parsed.hash) return null;
  const keys = [...parsed.searchParams.keys()];
  if (keys.length !== 1 || keys[0] !== "token") return null;
  const token = parsed.searchParams.get("token") ?? "";
  if (!INVITE_TOKEN_PATTERN.test(token)) return null;
  return `/invite?token=${encodeURIComponent(token)}`;
}

/**
 * Returns a same-origin path (+ search for React TaskFlow) or `fallback`.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = `${REACT_TASKFLOW_PREFIX}/dashboard`,
): string {
  if (!raw) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(raw, DUMMY_ORIGIN);
  } catch {
    return fallback;
  }

  if (parsed.origin !== DUMMY_ORIGIN) return fallback;
  if (parsed.username || parsed.password) return fallback;

  const pathname = parsed.pathname;
  if (isReactTaskflowPath(pathname)) {
    return `${pathname}${parsed.search}`;
  }
  if (isAngularAppPath(pathname)) {
    return pathname;
  }
  const invite = safeAngularInvitePath(parsed);
  if (invite) return invite;
  return fallback;
}

/** Sign-in page that matches the client that requested `next`. */
export function signInPathForNext(next: string): string {
  const pathname = next.split("?")[0] ?? next;
  if (
    isAngularAppPath(pathname) ||
    pathname === "/signin" ||
    pathname === "/invite"
  ) {
    return "/signin";
  }
  return `${REACT_TASKFLOW_PREFIX}/signin`;
}

/**
 * Public origin of the browser request.
 * Trusts X-Forwarded-Host only for loopback (Angular dev proxy → Next).
 * Production spoofed forwarded hosts are ignored.
 */
export function requestPublicOrigin(request: Request): string {
  const fallback = new URL(request.url).origin;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (!host) return fallback;
  const hostname = host.replace(/^\[|\]$/g, "").split(":")[0];
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return fallback;
  }
  const protoHeader = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const proto = protoHeader === "https" ? "https" : "http";
  return `${proto}://${host}`;
}
