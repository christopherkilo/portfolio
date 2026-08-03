import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function normalizeUrl(raw: string) {
  return raw.replace(/\/$/, "").replace(/\/rest\/v1$/i, "");
}

function safeNextPath(raw: string | null) {
  if (!raw) return "/demos/taskflow/dashboard";
  if (!raw.startsWith("/demos/taskflow")) return "/demos/taskflow/dashboard";
  return raw;
}

/**
 * Supabase OAuth PKCE callback.
 * Session cookies must be written onto the redirect response or middleware
 * will bounce the user straight back to sign-in.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const origin = requestUrl.origin;

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/demos/taskflow/signin?error=${encodeURIComponent(oauthError)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/demos/taskflow/signin?error=${encodeURIComponent(
        "Missing auth code. Check Supabase redirect URLs include /auth/callback.",
      )}`,
    );
  }

  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!url || !key) {
    return NextResponse.redirect(
      `${origin}/demos/taskflow/signin?error=${encodeURIComponent(
        "Supabase env vars are missing on the server.",
      )}`,
    );
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
          // Persist for this request context…
          cookieStore.set(name, value, options);
          // …and on the redirect response the browser actually receives.
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
    return NextResponse.redirect(
      `${origin}/demos/taskflow/signin?error=${encodeURIComponent(
        error.message || "Could not complete Google sign-in.",
      )}`,
    );
  }

  return redirectResponse;
}
