import type { AuthProviderId } from "@/lib/demos/event-horizon/authIntent";

export type AuthEnvLike = {
  AUTH_GITHUB_ID?: string | undefined;
  AUTH_GITHUB_SECRET?: string | undefined;
};

/**
 * Resolve which OAuth providers should be registered / shown.
 * Google is always primary. GitHub is included only when both
 * AUTH_GITHUB_ID and AUTH_GITHUB_SECRET are non-empty.
 */
export function resolveConfiguredAuthProviders(
  env: AuthEnvLike = process.env as AuthEnvLike,
): AuthProviderId[] {
  const providers: AuthProviderId[] = ["google"];
  const githubId = env.AUTH_GITHUB_ID?.trim();
  const githubSecret = env.AUTH_GITHUB_SECRET?.trim();
  if (githubId && githubSecret) {
    providers.push("github");
  }
  return providers;
}

export function isGitHubAuthConfigured(
  env: AuthEnvLike = process.env as AuthEnvLike,
): boolean {
  return resolveConfiguredAuthProviders(env).includes("github");
}
