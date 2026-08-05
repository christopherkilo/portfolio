"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { LoaderCircle } from "lucide-react";
import { Modal } from "@/components/demos/event-horizon/ui/Modal";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { useAuthModal } from "@/contexts/demos/event-horizon/AuthModalContext";
import { useToast } from "@/contexts/demos/event-horizon/ToastContext";
import {
  friendlySignInError,
  type AuthIntent,
  type AuthProviderId,
} from "@/lib/demos/event-horizon/authIntent";
import { cn } from "@/lib/demos/event-horizon/utils";

function callbackUrlForIntent(intent: AuthIntent | null): string {
  if (!intent) return "/demos/event-horizon";
  if (intent.type === "navigate") return intent.href;
  if (intent.type === "favorite") {
    return intent.eventSlug
      ? `/demos/event-horizon/events/${intent.eventSlug}`
      : "/demos/event-horizon/favorites";
  }
  if (intent.type === "reserve") {
    return `/demos/event-horizon/events/${intent.eventSlug}?reserve=1`;
  }
  return "/demos/event-horizon";
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.7.5-2.4 1.9C5.1 20 8.3 22 12 22c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 .9-3.6.9-2.8 0-5.1-1.9-5.9-4.4z"
      />
      <path
        fill="#4A90E2"
        d="M3.5 7.3C2.7 8.8 2.2 10.4 2.2 12s.5 3.2 1.3 4.7c0 .1 3.1-2.4 3.1-2.4-.2-.6-.3-1.2-.3-1.9 0-.7.1-1.3.3-1.9L3.5 7.3z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.3c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.3 14.7 1.4 12 1.4 8.3 1.4 5.1 3.4 3.5 7.3l3.1 2.4C7 7.2 9.2 5.3 12 5.3z"
      />
    </svg>
  );
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12 .5C5.7.5.6 5.6.6 11.9c0 5 3.3 9.3 7.8 10.8.6.1.8-.2.8-.5v-1.9c-3.2.7-3.8-1.4-3.8-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.7 1.7 2.7 1.2.1-.8.4-1.3.7-1.6-2.5-.3-5.2-1.3-5.2-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a10.9 10.9 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.2 5.7.4.3.8 1 .8 2.1v3.1c0 .3.2.6.8.5 4.5-1.5 7.8-5.8 7.8-10.8C23.4 5.6 18.3.5 12 .5z" />
    </svg>
  );
}

function parseAvailableProviders(payload: unknown): AuthProviderId[] {
  if (!payload || typeof payload !== "object") return ["google"];
  const ids = Object.keys(payload as Record<string, unknown>);
  const providers: AuthProviderId[] = [];
  if (ids.includes("google")) providers.push("google");
  if (ids.includes("github")) providers.push("github");
  return providers.length ? providers : ["google"];
}

export function SignInModal() {
  const { open, closeSignIn, intent } = useAuthModal();
  const { toast } = useToast();
  const [pending, setPending] = useState<AuthProviderId | null>(null);
  const [providers, setProviders] = useState<AuthProviderId[]>(["google"]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/auth/providers", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (!controller.signal.aborted) {
          setProviders(parseAvailableProviders(payload));
        }
      } catch {
        /* Keep Google-only fallback when the providers endpoint is unavailable. */
      }
    })();
    return () => controller.abort();
  }, [open]);

  const githubEnabled = providers.includes("github");

  async function continueWith(provider: AuthProviderId) {
    if (pending) return;
    if (!providers.includes(provider)) return;
    setPending(provider);
    try {
      await signIn(provider, {
        callbackUrl: callbackUrlForIntent(intent),
        redirect: true,
      });
    } catch (error) {
      toast(friendlySignInError(error));
      setPending(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (pending) return;
        closeSignIn();
      }}
      title="Sign in to Event Horizon"
      description={
        githubEnabled
          ? "Choose Google or GitHub to save favorites and reserve tickets. Browsing stays public."
          : "Continue with Google to save favorites and reserve tickets. Browsing stays public."
      }
      autoFocusClose={false}
    >
      <p className="text-sm text-muted">
        {githubEnabled
          ? "Continue with your preferred account. Google is recommended for the fastest sign-in."
          : "Continue with Google to access favorites and tickets."}
      </p>

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          data-autofocus
          disabled={Boolean(pending)}
          onClick={() => void continueWith("google")}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-accent/45 bg-[#0a0a0a] px-4 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent hover:text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60",
          )}
          aria-label="Continue with Google"
        >
          {pending === "google" ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <GoogleMark className="size-5 rounded-sm bg-white p-0.5" />
          )}
          {pending === "google"
            ? "Connecting to Google…"
            : "Continue with Google"}
        </button>

        {githubEnabled ? (
          <button
            type="button"
            disabled={Boolean(pending)}
            onClick={() => void continueWith("github")}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-bg px-4 text-sm font-semibold text-ink transition hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60"
            aria-label="Continue with GitHub"
          >
            {pending === "github" ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <GitHubMark className="size-5" />
            )}
            {pending === "github"
              ? "Connecting to GitHub…"
              : "Continue with GitHub"}
          </button>
        ) : null}

        <Button
          variant="ghost"
          className="w-full"
          disabled={Boolean(pending)}
          onClick={closeSignIn}
        >
          Cancel
        </Button>
      </div>

      <p className="mt-5 text-xs text-muted" aria-live="polite">
        {pending
          ? "Secure redirect in progress. Keep this tab open."
          : "We never see your password. Sessions use secure HTTP-only cookies."}
      </p>
    </Modal>
  );
}
