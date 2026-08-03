import "server-only";

/**
 * Lazy NovaTech server environment access.
 * Validates at request time (not import time) so builds succeed without secrets.
 */

export type NovatechServerEnv = {
  hubspotAccessToken: string;
  hubspotPipelineId: string;
  hubspotDealStageId: string;
  resendApiKey: string;
  fromEmail: string;
  staffEmail: string;
  turnstileSecretKey: string;
  appUrl: string;
  nodeEnv: string;
  allowTurnstileDevBypass: boolean;
};

export class EnvMissingError extends Error {
  readonly keys: string[];

  constructor(keys: string[]) {
    super(
      `NovaTech backend is missing required environment variable(s): ${keys.join(", ")}. Set them in .env.local (see .env.example).`,
    );
    this.name = "EnvMissingError";
    this.keys = keys;
  }
}

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getNovatechAppUrl(): string {
  const url = read("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getTurnstileRuntimeConfig() {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  return {
    secret: read("TURNSTILE_SECRET_KEY"),
    siteKey: read("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
    nodeEnv,
    allowDevBypass:
      nodeEnv !== "production" &&
      read("NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS") === "true",
  };
}

/**
 * Full server config required for HubSpot + Resend after Turnstile passes.
 */
export function getNovatechServerEnv(): NovatechServerEnv {
  const turnstile = getTurnstileRuntimeConfig();

  const values = {
    hubspotAccessToken: read("HUBSPOT_ACCESS_TOKEN"),
    hubspotPipelineId: read("HUBSPOT_PIPELINE_ID"),
    hubspotDealStageId: read("HUBSPOT_DEAL_STAGE_ID"),
    resendApiKey: read("RESEND_API_KEY"),
    fromEmail: read("NOVATECH_FROM_EMAIL"),
    staffEmail: read("NOVATECH_STAFF_EMAIL"),
    turnstileSecretKey: turnstile.secret,
    appUrl: getNovatechAppUrl(),
    nodeEnv: turnstile.nodeEnv,
    allowTurnstileDevBypass: turnstile.allowDevBypass,
  };

  const required: Array<{ key: keyof typeof values; env: string }> = [
    { key: "hubspotAccessToken", env: "HUBSPOT_ACCESS_TOKEN" },
    { key: "hubspotPipelineId", env: "HUBSPOT_PIPELINE_ID" },
    { key: "hubspotDealStageId", env: "HUBSPOT_DEAL_STAGE_ID" },
    { key: "resendApiKey", env: "RESEND_API_KEY" },
    { key: "fromEmail", env: "NOVATECH_FROM_EMAIL" },
    { key: "staffEmail", env: "NOVATECH_STAFF_EMAIL" },
  ];

  const missing = required
    .filter((item) => !values[item.key])
    .map((item) => item.env);

  if (
    turnstile.nodeEnv === "production" &&
    !turnstile.secret &&
    !missing.includes("TURNSTILE_SECRET_KEY")
  ) {
    missing.push("TURNSTILE_SECRET_KEY");
  }

  if (missing.length > 0) {
    throw new EnvMissingError(missing);
  }

  return values;
}

export function isTurnstileSiteKeyConfigured(): boolean {
  return Boolean(read("NEXT_PUBLIC_TURNSTILE_SITE_KEY"));
}
