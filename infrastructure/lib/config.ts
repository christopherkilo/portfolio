/**
 * Small, shared AWS infrastructure configuration.
 * Keep this file intentionally narrow — no large config framework.
 */
export const INFRA_ENVIRONMENT = "dev" as const;
export const DEFAULT_REGION = "us-east-2";
export const PROJECT_PREFIX = "portfolio";

export type InfraEnvironment = typeof INFRA_ENVIRONMENT;
export type InfraAppId = "event-horizon" | "novatech";

export interface InfraConfig {
  environment: InfraEnvironment;
  region: string;
  prefix: string;
}

export const infraConfig: InfraConfig = {
  environment: INFRA_ENVIRONMENT,
  region: process.env.CDK_DEFAULT_REGION ?? DEFAULT_REGION,
  prefix: PROJECT_PREFIX,
};

/** CDK environment from the CLI. Never hardcode an AWS account ID. */
export function getCdkEnv(): { account?: string; region: string } {
  return {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? DEFAULT_REGION,
  };
}
