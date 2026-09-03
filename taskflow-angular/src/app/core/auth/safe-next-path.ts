const DUMMY_ORIGIN = "https://taskflow.invalid";

export const ANGULAR_SAFE_PATHS = [
  "/dashboard",
  "/projects",
  "/tasks",
  "/calendar",
  "/team",
  "/audit",
  "/settings",
] as const;

/** Matches acceptInvitationSchema / server base64url tokens. */
export const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,200}$/;

export function isInviteToken(value: string): boolean {
  return INVITE_TOKEN_PATTERN.test(value);
}

export function safeAngularInvitePath(rawPathAndSearch: {
  pathname: string;
  searchParams: URLSearchParams;
  hash: string;
  username: string;
  password: string;
}): string | null {
  if (rawPathAndSearch.pathname !== "/invite") return null;
  if (rawPathAndSearch.username || rawPathAndSearch.password) return null;
  if (rawPathAndSearch.hash) return null;
  const keys = [...rawPathAndSearch.searchParams.keys()];
  if (keys.length !== 1 || keys[0] !== "token") return null;
  const token = rawPathAndSearch.searchParams.get("token") ?? "";
  if (!isInviteToken(token)) return null;
  return `/invite?token=${encodeURIComponent(token)}`;
}

/** Local Angular return paths only. Never accepts an external URL. */
export function safeAngularNextPath(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  let parsed: URL;
  try {
    parsed = new URL(raw, DUMMY_ORIGIN);
  } catch {
    return "/dashboard";
  }
  if (parsed.origin !== DUMMY_ORIGIN) return "/dashboard";
  if (parsed.username || parsed.password) return "/dashboard";
  const pathname = parsed.pathname;
  if ((ANGULAR_SAFE_PATHS as readonly string[]).includes(pathname)) {
    return pathname;
  }
  return safeAngularInvitePath(parsed) ?? "/dashboard";
}
