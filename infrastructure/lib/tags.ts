import { Tags } from "aws-cdk-lib/core";
import type { IConstruct } from "constructs";
import { infraConfig, type InfraAppId } from "./config";

export const STANDARD_TAGS = {
  Environment: infraConfig.environment,
  ManagedBy: "aws-cdk",
  Purpose: "portfolio-learning",
} as const;

export function stackTags(application: InfraAppId): Record<string, string> {
  return {
    Environment: STANDARD_TAGS.Environment,
    ManagedBy: STANDARD_TAGS.ManagedBy,
    Purpose: STANDARD_TAGS.Purpose,
    Application: application,
  };
}

/**
 * Apply standard stack tags so future resources inherit them.
 * Do not put account IDs, emails, usernames, or secrets in tags.
 */
export function applyStandardTags(scope: IConstruct, application: InfraAppId): void {
  for (const [key, value] of Object.entries(stackTags(application))) {
    Tags.of(scope).add(key, value);
  }
}
