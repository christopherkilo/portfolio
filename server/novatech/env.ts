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
  const allowDevBypassExplicit =
    read("NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS") === "true";
  return {
    secret: read("TURNSTILE_SECRET_KEY"),
    siteKey: read("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
    nodeEnv,
    allowDevBypass: nodeEnv !== "production" && allowDevBypassExplicit,
  };
}

/**
 * Full server config required for HubSpot + Resend after Turnstile passes.
 */
export function getNovatechServerEnv(): NovatechServerEnv {
  const turnstile = getTurnstileRuntimeConfig();
  const isProd = turnstile.nodeEnv === "production";

  // Soft local defaults — HubSpot "default" pipeline stage IDs work for most portals.
  // Production still requires explicit email configuration.
  const fromEmail =
    read("NOVATECH_FROM_EMAIL") ||
    (isProd ? "" : "onboarding@resend.dev");
  const staffEmail =
    read("NOVATECH_STAFF_EMAIL") ||
    (isProd ? "" : fromEmail || "onboarding@resend.dev");

  const values = {
    hubspotAccessToken: read("HUBSPOT_ACCESS_TOKEN"),
    hubspotPipelineId: read("HUBSPOT_PIPELINE_ID") || "default",
    hubspotDealStageId:
      read("HUBSPOT_DEAL_STAGE_ID") || "appointmentscheduled",
    resendApiKey: read("RESEND_API_KEY"),
    fromEmail,
    staffEmail,
    turnstileSecretKey: turnstile.secret,
    appUrl: getNovatechAppUrl(),
    nodeEnv: turnstile.nodeEnv,
    allowTurnstileDevBypass: turnstile.allowDevBypass,
  };

  const required: Array<{ key: keyof typeof values; env: string }> = [
    { key: "hubspotAccessToken", env: "HUBSPOT_ACCESS_TOKEN" },
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

export type NovaTechWorkflowConfig = {
  stateMachineArn: string;
  region: string;
  roleArn?: string;
};

/**
 * Server-only AWS workflow config for StartExecution.
 * Never expose these values through NEXT_PUBLIC_* or the browser.
 */
export function getNovaTechWorkflowConfig(): NovaTechWorkflowConfig {
  const stateMachineArn = read("NOVATECH_STATE_MACHINE_ARN");
  const region =
    read("NOVATECH_AWS_REGION") || read("AWS_REGION") || "us-east-2";
  const roleArn = read("AWS_ROLE_ARN") || undefined;

  if (!stateMachineArn || !stateMachineArn.startsWith("arn:aws:states:")) {
    throw new EnvMissingError(["NOVATECH_STATE_MACHINE_ARN"]);
  }

  return { stateMachineArn, region, roleArn };
}
