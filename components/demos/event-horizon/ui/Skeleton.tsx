export function EventCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-surface"
      aria-hidden
    >
      <div className="aspect-[16/10] animate-pulse bg-surface-elevated" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-surface-elevated" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-surface-elevated" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-elevated" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-surface-elevated" />
      </div>
    </div>
  );
}

/** Accessible label used by event grid loading skeletons. */
export const EVENT_GRID_LOADING_LABEL = "Loading events";

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label={EVENT_GRID_LOADING_LABEL}
    >
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Accessible label used by event detail loading placeholders. */
export const EVENT_DETAIL_LOADING_LABEL = "Loading event";

