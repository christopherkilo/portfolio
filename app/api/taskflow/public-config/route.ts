import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { InternalError } from "@/server/taskflow/errors";
import { toPublicRealtimeConfig } from "@/server/taskflow/realtime/publicConfig";
import { getTaskflowPublicEnv } from "@/server/taskflow/supabase/env";

export const runtime = "nodejs";

/**
 * Browser-safe Supabase URL + publishable key for Angular Realtime/Presence.
 * Ordinary TaskFlow CRUD remains HttpClient → Next API. This endpoint must
 * never include service-role material or session tokens.
 */
export async function GET() {
  try {
    const env = getTaskflowPublicEnv();
    if (!env.url || !env.publishableKey) {
      throw new InternalError(
        "TaskFlow backend is not configured. Check Supabase environment variables.",
      );
    }
    return jsonSuccess(toPublicRealtimeConfig(env));
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
