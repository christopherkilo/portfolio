/**
 * Layout-preserving Suspense fallback for the contact inquiry page.
 * Matches approximate header / form / sidebar / map dimensions to reduce CLS.
 */
export function ContactFormSkeleton() {
  return (
    <section
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading consultation form…</span>

      <div className="mb-10 max-w-2xl space-y-3" aria-hidden="true">
        <div className="h-3 w-20 rounded bg-border motion-safe:animate-pulse" />
        <div className="h-9 w-full max-w-md rounded-lg bg-border/80 motion-safe:animate-pulse" />
        <div className="h-4 w-full max-w-xl rounded bg-border/60 motion-safe:animate-pulse" />
        <div className="h-4 w-[80%] max-w-lg rounded bg-border/60 motion-safe:animate-pulse" />
      </div>

      <div
        className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]"
        aria-hidden="true"
      >
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7">
          <div className="mb-5 rounded-xl border border-info/20 bg-info-soft/50 px-4 py-3 space-y-2">
            <div className="h-2.5 w-32 rounded bg-border motion-safe:animate-pulse" />
            <div className="h-4 w-48 rounded bg-border/70 motion-safe:animate-pulse" />
          </div>

          <div className="space-y-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-24 rounded bg-border motion-safe:animate-pulse" />
                <div className="h-10 w-full rounded-lg border border-border bg-bg motion-safe:animate-pulse" />
              </div>
            ))}
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-border motion-safe:animate-pulse" />
              <div className="h-24 w-full rounded-lg border border-border bg-bg motion-safe:animate-pulse" />
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-4 w-28 rounded bg-border/60 motion-safe:animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 w-24 rounded-lg bg-border/50 motion-safe:animate-pulse" />
              <div className="h-10 w-40 rounded-lg bg-border motion-safe:animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-3"
            >
              <div className="h-4 w-36 rounded bg-border motion-safe:animate-pulse" />
              <div className="h-3 w-full rounded bg-border/60 motion-safe:animate-pulse" />
              <div className="h-3 w-[83%] rounded bg-border/50 motion-safe:animate-pulse" />
            </div>
          ))}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="map-grid h-40 w-full motion-safe:animate-pulse sm:h-48" />
            <div className="space-y-2 border-t border-border p-4">
              <div className="h-3 w-40 rounded bg-border motion-safe:animate-pulse" />
              <div className="h-3 w-56 rounded bg-border/60 motion-safe:animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
