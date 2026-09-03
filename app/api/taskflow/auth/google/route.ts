import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  requestPublicOrigin,
  safeNextPath,
  signInPathForNext,
} from "@/lib/demos/taskflow/auth/safeNextPath";
import { getTaskflowPublicEnv } from "@/server/taskflow/supabase/env";

function normalizeUrl(raw: string) {
  return raw.replace(/\/$/, "").replace(/\/rest\/v1$/i, "");
}

/**
 * Google OAuth start for the Angular client (Option A).
 * PKCE verifier cookies are written onto the redirect to Google so the
 * existing /auth/callback can exchange the code. React TaskFlow continues
 * to start OAuth via the browser supabase client.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestPublicOrigin(request);
  const next = safeNextPath(requestUrl.searchParams.get("next"), "/dashboard");
  const signIn = signInPathForNext(next);

  const fail = (message: string) => {
    const url = new URL(signIn, origin);
    url.searchParams.set("error", message);
    if (next !== "/demos/taskflow/dashboard") {
      url.searchParams.set("next", next);
    }
    return NextResponse.redirect(url);
  };

  const { url, publishableKey } = getTaskflowPublicEnv();
  if (!url || !publishableKey) {
    return fail("Authentication is temporarily unavailable.");
  }

  const cookieStore = await cookies();
  const pending: {
    name: string;
    value: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient(normalizeUrl(url), publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          pending.push({ name, value, options });
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    if (error) {
      console.error("[taskflow-auth-google]", {
        message: error.message,
        status: error.status,
      });
    }
    const response = fail("Could not start Google sign-in. Please try again.");
    pending.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  const response = NextResponse.redirect(data.url);
  pending.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
