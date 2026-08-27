import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("Event Horizon external-events UI wiring", () => {
  it("keeps native catalog cards on the Event Horizon reservation path", () => {
    const home = read("app/demos/event-horizon/page.tsx");
    const card = read("components/demos/event-horizon/events/EventCard.tsx");
    const browse = read("components/demos/event-horizon/events/BrowseClient.tsx");
    expect(home).toContain("FeaturedCarousel");
    expect(home).toContain("ExternalEventsRail");
    expect(card).toContain("/demos/event-horizon/events/${event.slug}");
    expect(browse).toContain("<EventCard");
    expect(browse).toContain("<ExternalEventCard");
  });

  it("maps Ticketmaster cards to sourceUrl CTAs without reservation controls", () => {
    const card = read("components/demos/event-horizon/events/ExternalEventCard.tsx");
    expect(card).toContain("Ticketmaster");
    expect(card).toContain("View Tickets");
    expect(card).toContain("getExternalEventCtaHref");
    expect(card).toContain('target="_blank"');
    expect(card).toContain("rel=\"noopener noreferrer\"");
    expect(card).not.toContain("Reserve Spot");
    expect(card).not.toContain("ticketTypes");
    expect(card).not.toContain("quantityRemaining");
    expect(card).not.toContain("/demos/event-horizon/events/");
    expect(card).toContain("event.venueName");
    expect(card).toContain("event.city");
    expect(card).toContain("event.imageUrl || placeholder");
  });

  it("falls back to the native catalog when the public API is missing or unavailable", () => {
    const browse = read("components/demos/event-horizon/events/BrowseClient.tsx");
    const rail = read("components/demos/event-horizon/home/ExternalEventsRail.tsx");
    const client = read("lib/demos/event-horizon/externalEvents.ts");
    expect(client).toContain("NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API");
    expect(client).toContain("process.env.NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API");
    expect(client).toContain('status: "unconfigured"');
    expect(client).toContain('status: "unavailable"');
    expect(browse).toContain("shouldShowNativeCatalog");
    expect(browse).toContain("External events are temporarily unavailable.");
    expect(rail).toContain("External events are temporarily unavailable.");
    expect(browse).not.toContain("AWS_ACCESS_KEY");
    expect(browse).not.toContain("lambda-url.us-east-2.on.aws");
  });

  it("exposes a source filter without replacing native browse behavior", () => {
    const sidebar = read("components/demos/event-horizon/events/FilterSidebar.tsx");
    const browse = read("components/demos/event-horizon/events/BrowseClient.tsx");
    expect(sidebar).toContain('["ticketmaster", "Ticketmaster"]');
    expect(sidebar).toContain('["event-horizon", "Event Horizon"]');
    const rail = read("components/demos/event-horizon/home/ExternalEventsRail.tsx");
    expect(browse).toContain("From Ticketmaster");
    expect(rail).toContain("source=ticketmaster");
  });
});
