"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/demos/novatech/ui/Button";
import { CTA, DEMO_BASE, SITE } from "@/lib/demos/novatech/constants";
import { contactHref } from "@/lib/demos/novatech/paths";

export default function NovaTechError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-4 py-20 sm:px-6">
      <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-error/10 text-error">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {SITE.name}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        This fictional demo page could not load. Retry, return home, or continue
        exploring illustrative services and work.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Retry</Button>
        <Button href={DEMO_BASE} variant="outline">
          Return home
        </Button>
        <Button href={`${DEMO_BASE}/services`} variant="ghost">
          {CTA.exploreServices}
        </Button>
        <Button href={`${DEMO_BASE}/portfolio`} variant="ghost">
          {CTA.viewWork}
        </Button>
        <Button href={contactHref()} variant="ghost">
          {CTA.contact}
        </Button>
      </div>
    </section>
  );
}
