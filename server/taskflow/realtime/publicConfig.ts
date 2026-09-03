/**
 * Browser-safe TaskFlow realtime configuration.
 * Never include service-role keys, secrets, or session material.
 */
export type TaskflowPublicRealtimeConfig = {
  supabaseUrl: string;
  publishableKey: string;
};

export function toPublicRealtimeConfig(env: {
  url: string;
  publishableKey: string;
}): TaskflowPublicRealtimeConfig {
  return {
    supabaseUrl: env.url,
    publishableKey: env.publishableKey,
  };
}

export function assertPublicRealtimeConfig(
  value: unknown,
): TaskflowPublicRealtimeConfig {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid public realtime config.");
  }
  const record = value as Record<string, unknown>;
  const forbidden = [
    "secretKey",
    "serviceRoleKey",
    "service_role",
    "access_token",
    "refresh_token",
    "SUPABASE_SECRET_KEY",
  ];
  for (const key of forbidden) {
    if (key in record) {
      throw new Error("Public realtime config must not include secrets.");
    }
  }
  if (
    typeof record.supabaseUrl !== "string" ||
    typeof record.publishableKey !== "string" ||
    !record.supabaseUrl ||
    !record.publishableKey
  ) {
    throw new Error("Public realtime config is incomplete.");
  }
  if (/service_role/i.test(record.publishableKey)) {
    throw new Error("Public realtime config rejected a service-role key.");
  }
  return {
    supabaseUrl: record.supabaseUrl,
    publishableKey: record.publishableKey,
  };
}
