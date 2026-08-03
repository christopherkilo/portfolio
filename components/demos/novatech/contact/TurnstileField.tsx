"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileFieldProps = {
  onTokenChange: (token: string | null) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  resetSignal?: number;
};

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Turnstile script failed to load")),
      );
      if (window.turnstile) resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed to load"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget.
 * When NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset in non-production, emits a
 * `dev-mock-token` for local testing with NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS.
 */
export function TurnstileField({
  onTokenChange,
  onError,
  disabled,
  resetSignal = 0,
}: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const labelId = useId();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const isProd = process.env.NODE_ENV === "production";

  useEffect(() => {
    onTokenChange(null);

    if (!siteKey) {
      if (isProd) {
        onError?.(
          "Human verification is not configured. Please try again later.",
        );
        return;
      }
      onTokenChange("dev-mock-token");
      return;
    }

    let cancelled = false;

    async function mount() {
      try {
        await loadTurnstileScript();
        if (cancelled || !containerRef.current || !window.turnstile) return;

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        containerRef.current.innerHTML = "";
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onTokenChange(token),
          "expired-callback": () => onTokenChange(null),
          "error-callback": () => {
            onTokenChange(null);
            onError?.(
              "Please verify that you’re human and try again.",
            );
          },
          theme: "auto",
        });
      } catch {
        if (!cancelled) {
          onError?.(
            "Please verify that you’re human and try again.",
          );
        }
      }
    }

    void mount();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset via resetSignal
  }, [siteKey, isProd, resetSignal]);

  useEffect(() => {
    if (!siteKey || !widgetIdRef.current || !window.turnstile) return;
    if (resetSignal > 0) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  if (!siteKey && !isProd) {
    return (
      <div className="rounded-lg border border-border bg-bg px-3 py-3 text-sm text-muted">
        <p id={labelId}>
          Human verification is using a local development mock. Set
          Turnstile keys and{" "}
          <code className="text-xs">NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS=true</code>{" "}
          for server acceptance.
        </p>
      </div>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <p id={labelId} className="mb-2 text-sm font-medium text-ink">
        Human verification
        <span className="ml-1 text-xs font-normal text-muted" aria-hidden>
          *
        </span>
        <span className="sr-only"> required</span>
      </p>
      <div
        ref={containerRef}
        role="group"
        aria-labelledby={labelId}
      />
    </div>
  );
}
