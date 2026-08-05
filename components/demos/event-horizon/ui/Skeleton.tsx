import { GravityLoader } from "@/components/demos/event-horizon/ui/GravityLoader";

export function EventCardSkeleton() {
  return (
    <div className="eh-card overflow-hidden rounded-2xl border bg-surface" aria-hidden>
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-accent/5 via-transparent to-highlight/5" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-surface-elevated" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-surface-elevated" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-elevated" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-surface-elevated" />
      </div>
    </div>
  );
}

export const EVENT_GRID_LOADING_LABEL = "Pulling events into view";

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label={EVENT_GRID_LOADING_LABEL}>
      <GravityLoader label={EVENT_GRID_LOADING_LABEL} size="sm" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export const EVENT_DETAIL_LOADING_LABEL = "Approaching event details";
