import { Hero } from "@/components/demos/event-horizon/home/Hero";
import { FeaturedCarousel } from "@/components/demos/event-horizon/events/FeaturedCarousel";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import {
  events,
  getFeaturedEvents,
} from "@/lib/demos/event-horizon/eventData";
import { getTrendingEvents } from "@/lib/demos/event-horizon/trending";
import { EventGrid } from "@/components/demos/event-horizon/events/EventGrid";
import { EmptyState } from "@/components/demos/event-horizon/ui/EmptyState";

export default function EventHorizonDemoHome() {
  const featured = getFeaturedEvents();
  const trending = getTrendingEvents(events, 6);
  const upcoming = [...events]
    .sort((a, b) => +new Date(a.startDateTime) - +new Date(b.startDateTime))
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
              Trending
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Trending this week
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Ranked from featured picks, ticket scarcity, popularity, and how
              soon each event starts.
            </p>
          </div>
          <Button href="/demos/event-horizon/browse?sort=popular" variant="outline" size="sm">
            See popular
          </Button>
        </div>
        {trending.length ? (
          <EventGrid events={trending} />
        ) : (
          <EmptyState
            title="Nothing trending right now"
            description="Check back soon, or browse the full catalog for upcoming nights out."
            actionHref="/demos/event-horizon/browse"
            actionLabel="Browse events"
          />
        )}
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
