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
      <section className="max-w-lg rounded-3xl border border-rose-400/20 bg-rose-400/[0.05] p-6 text-center" role="alert">
        <TriangleAlert className="mx-auto size-7 text-rose-300" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold">Toolkit view unavailable</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This interface could not be rendered. No system information was collected or changed.
        </p>
        <button type="button" onClick={reset} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-primary">
          <RotateCcw className="size-4" />Retry view
        </button>
      </section>
    </div>
  );
}
