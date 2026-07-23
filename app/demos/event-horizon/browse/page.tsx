import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseClient } from "@/components/demos/event-horizon/events/BrowseClient";
import { EventGridSkeleton } from "@/components/demos/event-horizon/ui/Skeleton";

export const metadata: Metadata = {
  title: "Browse Events",
  description: "Search and filter local events by category, date, and city.",
};

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10">
          <EventGridSkeleton />
        </div>
      }
    >
      <BrowseClient />
    </Suspense>
  );
}
