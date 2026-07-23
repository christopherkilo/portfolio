export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4" aria-hidden>
      <div className="h-3 w-20 animate-pulse rounded bg-subtle-strong" />
      <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-subtle-strong" />
      <div className="mt-2 h-3 w-full animate-pulse rounded bg-subtle-strong" />
      <div className="mt-4 h-1.5 w-full animate-pulse rounded bg-subtle-strong" />
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
