"use client";

import { useEffect, useState } from "react";
import { ExternalEventCard } from "@/components/demos/event-horizon/events/ExternalEventCard";
import { EventGridSkeleton } from "@/components/demos/event-horizon/ui/Skeleton";
import {
  fetchExternalEvents,
  type PublicExternalEvent,
} from "@/lib/demos/event-horizon/externalEvents";
import { Button } from "@/components/demos/event-horizon/ui/Button";

export function ExternalEventsRail() {
  const [items, setItems] = useState<PublicExternalEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "unavailable" | "unconfigured">(
    "loading",
  );

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const result = await fetchExternalEvents({ signal: controller.signal, limit: 12 });
        if (controller.signal.aborted) return;
        setItems(result.items);
        setStatus(result.status);
      } catch {
        if (controller.signal.aborted) return;
        setStatus("unavailable");
      }
    })();
    return () => controller.abort();
  }, []);

  if (status === "unconfigured") {
    return null;
  }

  if (status === "unavailable") {
    return (
      <p className="text-sm text-muted" role="status">
        External events are temporarily unavailable.
      </p>
    );
  }

  if (status === "loading") {
    return (
      <section aria-labelledby="external-events-home-title">
        <RailHeading />
        <EventGridSkeleton count={3} />
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="external-events-home-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <RailHeading />
        <Button href="/demos/event-horizon/browse?source=ticketmaster" variant="outline" size="sm">
          View all
        </Button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.slice(0, 6).map((event) => (
          <ExternalEventCard key={`${event.provider}-${event.externalId}`} event={event} />
        ))}
      </div>
    </section>
  );
}

function RailHeading() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        From Ticketmaster
      </p>
      <h2
        id="external-events-home-title"
        className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl"
      >
        Dallas discovery events
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Live listings from Ticketmaster. These are discovery links — tickets are sold on
        Ticketmaster, not reserved through Event Horizon.
      </p>
    </div>
  );
}
