import {
  EVENT_DETAIL_LOADING_LABEL,
} from "@/components/demos/event-horizon/ui/Skeleton";

export default function EventDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div
          className="aspect-[16/10] animate-pulse rounded-2xl bg-surface-elevated"
          aria-hidden
        />
        <div
          className="space-y-4"
          aria-busy="true"
          aria-label={EVENT_DETAIL_LOADING_LABEL}
        >
          <div className="h-3 w-20 animate-pulse rounded bg-surface-elevated" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-surface-elevated" />
          <div className="h-20 w-full animate-pulse rounded bg-surface-elevated" />
          <div className="h-48 w-full animate-pulse rounded-2xl bg-surface-elevated" />
          <div className="flex gap-3">
            <div className="h-11 w-32 animate-pulse rounded-xl bg-surface-elevated" />
            <div className="h-11 w-28 animate-pulse rounded-xl bg-surface-elevated" />
          </div>
        </div>
      </div>
    </div>
  );
}
