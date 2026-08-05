import { GravityLoader } from "@/components/demos/event-horizon/ui/GravityLoader";
import { EventGridSkeleton } from "@/components/demos/event-horizon/ui/Skeleton";

export default function EventHorizonLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 flex justify-center">
        <GravityLoader label="Crossing the event horizon…" size="md" />
      </div>
      <EventGridSkeleton count={6} />
    </div>
  );
}
