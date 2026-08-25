import { infraConfig, type InfraAppId } from "./config";

/**
 * Predictable development resource names:
 * `{prefix}-{environment}-{app}-{resource}`
 *
 * Examples:
 *   resourceName("event-horizon", "ingestion-queue")
 *     → portfolio-dev-event-horizon-ingestion-queue
 *   resourceName("novatech", "inquiry-workflow")
 *     → portfolio-dev-novatech-inquiry-workflow
 */
export function resourceName(app: InfraAppId, resource: string): string {
  const slug = resource.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return `${infraConfig.prefix}-${infraConfig.environment}-${app}-${slug}`;
}

export function stackDisplayName(app: InfraAppId): string {
  return resourceName(app, "stack");
}
