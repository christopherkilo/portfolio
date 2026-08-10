"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

export default function ToolkitError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center p-4">
      <section className="max-w-lg rounded-3xl border border-danger/25 bg-danger/10 p-6 text-center" role="alert">
        <TriangleAlert className="mx-auto size-7 text-danger" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold">Toolkit view unavailable</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This interface could not be rendered. No system information was collected or changed.
        </p>
        <button type="button" onClick={reset} className="mt-5 tk-btn-primary gap-2 px-4 py-2">
          <RotateCcw className="size-4" />Retry view
        </button>
      </section>
    </div>
  );
}
