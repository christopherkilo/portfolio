"use client";

import { useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { TaskflowMark } from "@/components/demos/taskflow/brand/TaskflowMark";
import { createTaskflowBrowserClient } from "@/lib/demos/taskflow/supabase/browser";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { DEMO_BASE } from "@/lib/demos/taskflow/data";

function safeNextPath(raw: string | null) {
  if (!raw) return `${DEMO_BASE}/dashboard`;
  if (!raw.startsWith(DEMO_BASE)) return `${DEMO_BASE}/dashboard`;
  return raw;
}

function isLocalDevHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function subscribeNoop() {
  return () => {};
}

/** Local-only callback hint — never hardcoded localhost for production visitors. */
function getLocalCallbackUrl(): string | null {
  if (typeof window === "undefined") return null;
  if (!isLocalDevHost(window.location.hostname)) return null;
  return `${window.location.origin}/auth/callback`;
}

export function TaskflowSignInView() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const urlError = searchParams.get("error");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(urlError ?? "");
  const localCallbackUrl = useSyncExternalStore(
    subscribeNoop,
    getLocalCallbackUrl,
    () => null,
  );

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
          : "Could not start Google sign-in. Please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <TaskflowMark size="lg" />
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Welcome to TaskFlow
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          Collaborative project management with live workspaces, tasks, and
          team views. Sign in with Google to open the seeded demo workspace.
        </p>
      </div>

      <Button
        type="button"
        disabled={busy}
        onClick={() => void signInWithGoogle()}
        className="min-h-11 w-full max-w-xs"
      >
        {busy ? "Redirecting…" : "Continue with Google"}
      </Button>

      <p className="max-w-sm text-xs leading-relaxed text-muted">
        Google authentication required. After sign-in you land on the dashboard
        with demo projects and tasks ready to explore.
      </p>

      {error ? (
        <div
          role="alert"
          className="w-full rounded-lg border border-danger/30 bg-danger/10 px-3 py-3 text-left text-xs text-danger"
        >
          <p className="font-medium">Sign-in failed</p>
          <p className="mt-1 break-words text-danger/90">{error}</p>
          <p className="mt-2 text-muted">
            Try again with Google. If this keeps happening, the demo may be
            temporarily unavailable.
          </p>
        </div>
      ) : null}

      {localCallbackUrl ? (
        <details className="w-full rounded-lg border border-border bg-elevated/40 px-3 py-2 text-left text-[11px] text-muted">
          <summary className="cursor-pointer font-medium text-ink">
            Local development setup
          </summary>
          <p className="mt-2 leading-relaxed">
            In Supabase → Authentication → URL Configuration, add this redirect
            for your current origin:
          </p>
          <code className="mt-1.5 block break-all rounded bg-bg/60 px-2 py-1.5 text-[10px] text-ink">
            {localCallbackUrl}
          </code>
          <p className="mt-2 leading-relaxed">
            Full checklist:{" "}
            <span className="text-ink">TASKFLOW_AUTHENTICATION.md</span> in the
            repo.
          </p>
        </details>
      ) : null}
    </div>
  );
}
