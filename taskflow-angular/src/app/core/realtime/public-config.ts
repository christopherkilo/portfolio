export type TaskflowPublicRealtimeConfig = {
  supabaseUrl: string;
  publishableKey: string;
};

const FORBIDDEN = [
  "secretKey",
  "serviceRoleKey",
  "service_role",
  "access_token",
  "refresh_token",
  "SUPABASE_SECRET_KEY",
];

export function assertPublicRealtimeConfig(
  value: unknown,
): TaskflowPublicRealtimeConfig {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid public realtime config.");
  }
  const record = value as Record<string, unknown>;
  for (const key of FORBIDDEN) {
    if (key in record) {
      throw new Error("Public realtime config must not include secrets.");
    }
  }
  if (
    typeof record["supabaseUrl"] !== "string" ||
    typeof record["publishableKey"] !== "string" ||
    !record["supabaseUrl"] ||
    !record["publishableKey"]
  ) {
    throw new Error("Public realtime config is incomplete.");
  }
  if (/service_role/i.test(record["publishableKey"])) {
    throw new Error("Public realtime config rejected a service-role key.");
  }
  return {
    supabaseUrl: record["supabaseUrl"],
    publishableKey: record["publishableKey"],
  };
}
