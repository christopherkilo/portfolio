import { Hero } from "@/components/demos/event-horizon/home/Hero";
import { FeaturedCarousel } from "@/components/demos/event-horizon/events/FeaturedCarousel";
import { DiscoveryRail } from "@/components/demos/event-horizon/home/DiscoveryRail";
import { ExternalEventsRail } from "@/components/demos/event-horizon/home/ExternalEventsRail";
import { EmptyState } from "@/components/demos/event-horizon/ui/EmptyState";
import { events } from "@/lib/demos/event-horizon/eventData";
import {
  getFeaturedDiscoveryEvents,
  getHomeDiscoverySections,
} from "@/lib/demos/event-horizon/discovery";
import { getTrendingEvents } from "@/lib/demos/event-horizon/trending";

export default function EventHorizonDemoHome() {
  const featured = getFeaturedDiscoveryEvents(events);
  const sections = getHomeDiscoverySections(events);
  const trendingIds = new Set(getTrendingEvents(events, 12).map((event) => event.id));

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6 lg:px-8">
        <FeaturedCarousel events={featured} />
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6 lg:px-8">
        <ExternalEventsRail />
      </div>

      <div className="mx-auto max-w-6xl space-y-4 px-4 pb-20 sm:px-6 lg:px-8">
        {sections.length ? (
          sections.map((section) => (
            <DiscoveryRail
              key={section.id}
              section={section}
              trendingIds={trendingIds}
              className="border-b border-border/60 py-12 last:border-b-0"
            />
          ))
        ) : (
          <EmptyState
            title="We couldn’t find anything nearby"
            description="Try expanding your search or explore another category — something worth the night is usually close."
            actionHref="/demos/event-horizon/browse"
            actionLabel="Browse events"
            secondaryActionHref="/demos/event-horizon/browse?sort=popular"
            secondaryActionLabel="Explore popular"
          />
        )}
      </div>
    </>
  );
}
