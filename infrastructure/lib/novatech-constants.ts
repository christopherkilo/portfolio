export const WORKFLOW_TTL_SECONDS = 14 * 24 * 60 * 60;

/** Existing SecureString. Imported by name so stack deletion does not delete it. */
export const HUBSPOT_ACCESS_TOKEN_PARAMETER_NAME =
  "/portfolio/dev/novatech/hubspot-access-token";

/** Existing SecureString. Imported by name so stack deletion does not delete it. */
export const RESEND_API_KEY_PARAMETER_NAME = "/portfolio/dev/novatech/resend-api-key";

/**
 * Non-secret email configuration. Same Resend test sender Next.js uses locally.
 * Not credentials — do not store these as SecureStrings.
 */
export const NOVATECH_FROM_EMAIL = "onboarding@resend.dev";
export const NOVATECH_STAFF_EMAIL = "onboarding@resend.dev";
export const NOVATECH_APP_URL = "https://www.christopherkilo.com";

/**
 * Public Vercel team/project identifiers for OIDC trust.
 * These are not secrets. Used only to let Production and Preview
 * assume the StartExecution role. Local `next dev` uses the AWS CLI profile.
 */
export const VERCEL_TEAM_SLUG = "christopherkilos-projects";
export const VERCEL_PROJECT_NAME = "portfolio";
