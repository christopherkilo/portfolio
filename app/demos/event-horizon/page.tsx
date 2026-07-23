import { Hero } from "@/components/demos/event-horizon/home/Hero";
import { FeaturedCarousel } from "@/components/demos/event-horizon/events/FeaturedCarousel";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { getFeaturedEvents, events } from "@/lib/demos/event-horizon/eventData";
import { EventGrid } from "@/components/demos/event-horizon/events/EventGrid";

export default function EventHorizonDemoHome() {
  const featured = getFeaturedEvents();
  const upcoming = [...events]
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .slice(0, 6);

  return (
    <>
      <Hero />
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
        <FeaturedCarousel events={featured} />
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Upcoming
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Happening soon
            </h2>
          </div>
          <Button href="/demos/event-horizon/browse" variant="outline" size="sm">
            View all
          </Button>
        </div>
        <EventGrid events={upcoming} />
      </section>
    </>
  );
}
