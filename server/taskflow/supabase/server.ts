import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  getTaskflowServerEnv,
  isTaskflowSupabaseConfigured,
} from "@/server/taskflow/supabase/env";
import type { Database } from "@/server/taskflow/types/database";

export type TaskflowSupabase = SupabaseClient<Database>;

export function createTaskflowAdminClient(): TaskflowSupabase {
  const env = getTaskflowServerEnv();
  return createClient<Database>(env.url, env.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createTaskflowServerClient(): Promise<TaskflowSupabase> {
  const env = getTaskflowServerEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — proxy refreshes sessions.
        }
      },
    },
  });
}

export { isTaskflowSupabaseConfigured };
