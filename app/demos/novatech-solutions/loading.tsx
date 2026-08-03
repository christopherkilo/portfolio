export default function NovaTechLoading() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="sr-only">Loading NovaTech Solutions demo content…</p>
      <div className="mb-10 space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-border/80" />
        <div className="h-9 w-72 max-w-full animate-pulse rounded bg-border/80" />
        <div className="h-4 w-full max-w-lg animate-pulse rounded bg-border/60" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-2xl border border-border bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
