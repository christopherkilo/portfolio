import { EventGridSkeleton } from "@/components/demos/event-horizon/ui/Skeleton";

export default function FavoritesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3">
        <div className="h-9 w-40 animate-pulse rounded bg-surface-elevated" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-surface-elevated" />
      </div>
      <EventGridSkeleton count={3} />
    </div>
  );
}
