"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { useAuthModal } from "@/contexts/demos/event-horizon/AuthModalContext";
import { useToast } from "@/contexts/demos/event-horizon/ToastContext";
import {
  friendlySignInError,
  type AuthProviderId,
} from "@/lib/demos/event-horizon/authIntent";

function SignInInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openSignIn } = useAuthModal();
  const { toast } = useToast();
  const [pending, setPending] = useState<AuthProviderId | null>(null);
  const [providers, setProviders] = useState<AuthProviderId[]>(["google"]);
  const callbackUrl =
    searchParams.get("callbackUrl") || "/demos/event-horizon/tickets";
  const githubEnabled = providers.includes("github");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  useEffect(() => {
    openSignIn({ type: "navigate", href: callbackUrl });
  }, [openSignIn, callbackUrl]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/auth/providers", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as Record<string, unknown>;
        if (controller.signal.aborted) return;
        const next: AuthProviderId[] = [];
        if ("google" in payload) next.push("google");
        if ("github" in payload) next.push("github");
        setProviders(next.length ? next : ["google"]);
      } catch {
        /* Keep Google-only fallback. */
      }
    })();
    return () => controller.abort();
  }, []);

  async function continueWith(provider: AuthProviderId) {
    if (pending) return;
    if (!providers.includes(provider)) return;
    setPending(provider);
    try {
      await signIn(provider, { callbackUrl, redirect: true });
    } catch (error) {
      toast(friendlySignInError(error));
      setPending(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        Account
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
        Sign in to Event Horizon
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {githubEnabled
          ? "Google is the primary option. GitHub is available when configured. Browsing events stays public."
          : "Continue with Google to save favorites and reserve tickets. Browsing events stays public."}
      </p>
      <div className="mt-8 flex w-full flex-col gap-3">
        <Button
          className="w-full"
          disabled={Boolean(pending)}
          onClick={() => void continueWith("google")}
        >
          {pending === "google" ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Connecting…
            </>
          ) : (
            "Continue with Google"
          )}
        </Button>
        {githubEnabled ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={Boolean(pending)}
            onClick={() => void continueWith("github")}
          >
            {pending === "github" ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Connecting…
              </>
            ) : (
              "Continue with GitHub"
            )}
          </Button>
        ) : null}
        <Button
          href="/demos/event-horizon/browse"
          variant="ghost"
          className="w-full"
        >
          Keep browsing
        </Button>
      </div>
    </div>
  );
}

export function SignInClient() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-muted">
          Loading sign-in…
        </div>
      }
    >
      <SignInInner />
    </Suspense>
  );
}
