import { EventGridSkeleton } from "@/components/demos/event-horizon/ui/Skeleton";

export default function BrowseLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <aside className="hidden space-y-4 lg:block" aria-hidden>
        <div className="h-8 w-32 animate-pulse rounded bg-surface-elevated" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface-elevated" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface-elevated" />
      </aside>
      <div>
        <div className="mb-6 space-y-3">
          <div className="h-9 w-48 animate-pulse rounded bg-surface-elevated" />
          <div className="h-4 w-40 animate-pulse rounded bg-surface-elevated" />
        </div>
        <EventGridSkeleton count={6} />
      </div>
    </div>
  );
}
