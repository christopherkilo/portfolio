import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  requestPublicOrigin,
  safeNextPath,
  signInPathForNext,
} from "@/lib/demos/taskflow/auth/safeNextPath";

function normalizeUrl(raw: string) {
  return raw.replace(/\/$/, "").replace(/\/rest\/v1$/i, "");
}

/**
 * Supabase OAuth PKCE callback.
 * Session cookies must be written onto the redirect response or the TaskFlow
 * proxy will bounce the user straight back to sign-in.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestPublicOrigin(request);
  const code = requestUrl.searchParams.get("code");
  const oauthError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const signIn = signInPathForNext(next);

  const redirectToSignIn = (message: string) => {
    const url = new URL(signIn, origin);
    url.searchParams.set("error", message);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  };

  if (oauthError) {
    return redirectToSignIn(oauthError);
  }

  if (!code) {
    return redirectToSignIn("Sign-in could not complete. Please try again.");
  }

  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!url || !key) {
    return redirectToSignIn("Authentication is temporarily unavailable.");
  }

  const cookieStore = await cookies();
  const redirectResponse = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          redirectResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[taskflow-auth-callback]", {
      message: error.message,
      status: error.status,
    });
    return redirectToSignIn("Could not complete Google sign-in.");
  }

  return redirectResponse;
}
