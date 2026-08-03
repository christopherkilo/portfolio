import "server-only";

/**
 * Lazy TaskFlow Supabase environment access.
 * Validates at request time so builds succeed without secrets.
 */

export class TaskflowEnvError extends Error {
  readonly keys: string[];

  constructor(keys: string[]) {
    super(
      `TaskFlow is missing required environment variable(s): ${keys.join(", ")}. Set them in .env.local.`,
    );
    this.name = "TaskflowEnvError";
    this.keys = keys;
  }
}

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

/** Supabase project URL without trailing /rest/v1 path. */
export function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/$/, "");
  return trimmed.replace(/\/rest\/v1$/i, "");
}

export function getTaskflowPublicEnv() {
  const url = normalizeSupabaseUrl(read("NEXT_PUBLIC_SUPABASE_URL"));
  const publishableKey = read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return { url, publishableKey };
}

export function isTaskflowSupabaseConfigured(): boolean {
  const { url, publishableKey } = getTaskflowPublicEnv();
  return Boolean(url && publishableKey);
}

export function getTaskflowServerEnv() {
  const { url, publishableKey } = getTaskflowPublicEnv();
  const secretKey = read("SUPABASE_SECRET_KEY");
  const appUrl = (read("NEXT_PUBLIC_APP_URL") || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!publishableKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!secretKey) missing.push("SUPABASE_SECRET_KEY");
  if (missing.length) throw new TaskflowEnvError(missing);

  return { url, publishableKey, secretKey, appUrl };
}
