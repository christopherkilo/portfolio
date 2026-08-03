import Link from "next/link";
import { Compass } from "lucide-react";
import type { EventItem } from "@/lib/demos/event-horizon/eventData";
import { EventCard } from "@/components/demos/event-horizon/events/EventCard";
import { Button } from "@/components/demos/event-horizon/ui/Button";

type EventNotFoundProps = {
  featured: EventItem[];
  title?: string;
  description?: string;
};

export function EventNotFound({
  featured,
  title = "Event not found",
  description = "That listing may have moved, expired, or never existed in this demo catalog. Browse live events or return home.",
}: EventNotFoundProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Compass className="size-6" aria-hidden />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          404
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/demos/event-horizon/browse">Browse Events</Button>
          <Button href="/demos/event-horizon" variant="outline">
            Home
          </Button>
        </div>
      </div>

      {featured.length ? (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Suggested
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                Featured events
              </h2>
            </div>
            <Link
              href="/demos/event-horizon/browse?featured=true"
              className="text-sm font-medium text-accent hover:underline"
            >
              View featured
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
