"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createTaskflowBrowserClient } from "@/lib/demos/taskflow/supabase/browser";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { DEMO_BASE } from "@/lib/demos/taskflow/data";

function safeNextPath(raw: string | null) {
  if (!raw) return `${DEMO_BASE}/dashboard`;
  if (!raw.startsWith(DEMO_BASE)) return `${DEMO_BASE}/dashboard`;
  return raw;
}

export function TaskflowSignInView() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const urlError = searchParams.get("error");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(urlError ?? "");

  async function signInWithGoogle() {
    setBusy(true);
    setError("");
    try {
      const supabase = createTaskflowBrowserClient();
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setBusy(false);
      }
      // On success the browser navigates away to Google.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start Google sign-in. Check Supabase env vars.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="font-display text-2xl font-semibold">Welcome to TaskFlow</h1>
      <p className="text-sm text-muted">
        Sign in with Google to access your collaborative workspace. Data is
        stored in Supabase with row-level security.
      </p>
      <Button
        type="button"
        disabled={busy}
        onClick={() => void signInWithGoogle()}
      >
        {busy ? "Redirecting…" : "Continue with Google"}
      </Button>
      {error ? (
        <div
          role="alert"
          className="w-full rounded-lg border border-danger/30 bg-danger/10 px-3 py-3 text-left text-xs text-danger"
        >
          <p className="font-medium">Sign-in failed</p>
          <p className="mt-1 break-words">{error}</p>
          <p className="mt-3 text-muted">
            TaskFlow uses <strong className="text-ink">Supabase Auth</strong>, not
            Event Horizon Auth.js. In the Supabase dashboard: enable Google,
            paste your Google Client ID/Secret, add redirect{" "}
            <code className="text-[10px]">
              http://localhost:3000/auth/callback
            </code>
            , and in Google Cloud add{" "}
            <code className="text-[10px]">
              https://YOUR_PROJECT.supabase.co/auth/v1/callback
            </code>
            .
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-muted">
          Requires Google enabled under Supabase → Authentication → Providers,
          plus redirect URL{" "}
          <code className="text-[10px]">http://localhost:3000/auth/callback</code>
          .
        </p>
      )}
    </div>
  );
}
