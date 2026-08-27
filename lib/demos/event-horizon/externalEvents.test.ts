import { afterEach, describe, expect, it, vi } from "vitest";
import { events, filterEvents, DEFAULT_EVENT_FILTERS } from "./eventData";
import {
  externalEventSupportsReservation,
  fetchExternalEvents,
  filterExternalEvents,
  getExternalEventCtaHref,
  getExternalEventsApiUrl,
  shouldShowExternalCatalog,
  shouldShowNativeCatalog,
  type PublicExternalEvent,
} from "./externalEvents";

const NOW = new Date("2026-08-26T18:00:00.000Z");

function tmEvent(overrides: Partial<PublicExternalEvent> = {}): PublicExternalEvent {
  return {
    provider: "ticketmaster",
    externalId: "Z7r9jZ1A7-orZ",
    title: "PawPaw Rod",
    startsAt: "2026-08-28T01:00:00.000Z",
    city: "Dallas",
    state: "TX",
    venueName: "Club Dada",
    sourceUrl: "https://www.ticketmaster.com/event/Z7r9jZ1A7-orZ",
    imageUrl: "https://s1.ticketm.net/dam/a/event/hero.jpg",
    category: "Music",
    genre: "Hip-Hop/Rap",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("external events client", () => {
  it("reads the API URL from a single env var and does not require AWS keys", () => {
    expect(
      getExternalEventsApiUrl({
        NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API: " https://example.lambda-url.us-east-2.on.aws/ ",
        AWS_ACCESS_KEY_ID: "should-not-be-used",
      }),
    ).toBe("https://example.lambda-url.us-east-2.on.aws");
    expect(getExternalEventsApiUrl({})).toBe("");
  });

  it("maps Ticketmaster records to a sourceUrl CTA and never enables reservations", () => {
    const event = tmEvent();
    expect(getExternalEventCtaHref(event)).toBe(
      "https://www.ticketmaster.com/event/Z7r9jZ1A7-orZ",
    );
    expect(externalEventSupportsReservation()).toBe(false);
    expect(getExternalEventCtaHref(tmEvent({ sourceUrl: undefined }))).toBeUndefined();
    expect(getExternalEventCtaHref(tmEvent({ sourceUrl: "http://insecure.example" }))).toBeUndefined();
  });

  it("keeps native catalog independent of Ticketmaster availability", () => {
    const native = filterEvents(events, DEFAULT_EVENT_FILTERS);
    expect(native.length).toBeGreaterThan(0);
    expect(shouldShowNativeCatalog("all")).toBe(true);
    expect(shouldShowNativeCatalog("event-horizon")).toBe(true);
    expect(shouldShowNativeCatalog("ticketmaster")).toBe(false);
    expect(shouldShowExternalCatalog("all", false)).toBe(true);
    expect(shouldShowExternalCatalog("ticketmaster", false)).toBe(true);
    expect(shouldShowExternalCatalog("event-horizon", false)).toBe(false);
    expect(shouldShowExternalCatalog("all", true)).toBe(false);
  });

  it("filters future Ticketmaster events and tolerates missing optional fields", () => {
    const sparse: PublicExternalEvent = {
      provider: "ticketmaster",
      externalId: "sparse",
      title: "Sparse Night",
      startsAt: "2026-09-01T00:00:00.000Z",
    };
    const selected = filterExternalEvents(
      [
        tmEvent({ startsAt: "2026-08-01T00:00:00.000Z", externalId: "past" }),
        sparse,
        tmEvent({ title: "Save Ferris", externalId: "save", category: "Music" }),
      ],
      { query: "", category: "All", city: "All", date: "" },
      NOW,
    );
    expect(selected.map((event) => event.externalId)).toEqual(["save", "sparse"]);
    expect(selected[1]?.venueName).toBeUndefined();
    expect(selected[1]?.imageUrl).toBeUndefined();
  });

  it("falls back cleanly when the public API is missing or unavailable", async () => {
    await expect(fetchExternalEvents({ env: {} })).resolves.toEqual({
      status: "unconfigured",
      items: [],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    await expect(
      fetchExternalEvents({
        env: { NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API: "https://example.invalid" },
      }),
    ).resolves.toEqual({ status: "unavailable", items: [] });
  });

  it("parses a successful reader payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            provider: "ticketmaster",
            count: 1,
            items: [tmEvent()],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const result = await fetchExternalEvents({
      env: { NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API: "https://example.lambda-url.on.aws" },
    });
    expect(result.status).toBe("ok");
    expect(result.items[0]?.externalId).toBe("Z7r9jZ1A7-orZ");
  });
});
