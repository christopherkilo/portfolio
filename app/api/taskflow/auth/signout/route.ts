import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { InternalError } from "@/server/taskflow/errors";
import { getTaskflowPublicEnv } from "@/server/taskflow/supabase/env";

export const runtime = "nodejs";

/**
 * Server-side sign-out for the Angular client.
 * Clears the Supabase Auth cookies on this response. React continues to
 * call supabase.auth.signOut() in the browser.
 */
export async function POST() {
  try {
    const { url, publishableKey } = getTaskflowPublicEnv();
    if (!url || !publishableKey) {
      throw new InternalError(
        "TaskFlow backend is not configured. Check Supabase environment variables.",
      );
    }

    const cookieStore = await cookies();
    const response = jsonSuccess({ signedOut: true });

    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new InternalError(error.message);
    }

    return response;
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
