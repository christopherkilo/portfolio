"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/demos/event-horizon/ui/Button";

export default function EventHorizonError({
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
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-warm/15 text-warm">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        Something went wrong
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
        We hit turbulence
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Event Horizon could not load this view. Retry the page, head home, or
        browse the catalog while we stabilize.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Button href="/demos/event-horizon" variant="outline">
          Return Home
        </Button>
        <Button href="/demos/event-horizon/browse" variant="ghost">
          Browse Events
        </Button>
      </div>
    </div>
  );
}
