import {
  processReaderRequest,
  type ExternalEventsStore,
} from "../lambda/event-horizon-external-events-reader/handler";
import {
  parseReaderQuery,
  selectFutureExternalEvents,
  toPublicExternalEvent,
} from "../lambda/event-horizon-external-events-reader/sanitize";

const NOW = new Date("2026-08-26T18:00:00.000Z");

function ticketmasterItem(overrides: Record<string, unknown> = {}) {
  return {
    provider: "ticketmaster",
    externalId: "Z7r9jZ1Ad8eP8",
    title: "Dallas Symphony at the Meyerson",
    startsAt: "2026-09-16T00:30:00.000Z",
    city: "Dallas",
    state: "TX",
    venueName: "Morton H. Meyerson Symphony Center",
    sourceUrl: "https://www.ticketmaster.com/event/Z7r9jZ1Ad8eP8",
    imageUrl: "https://s1.ticketm.net/dam/a/event/hero-2048.jpg",
    category: "Music",
    genre: "Classical",
    latitude: 32.7767,
    longitude: -96.797,
    ingestedAt: "2026-08-26T21:33:20.422Z",
    updatedAt: "2026-08-26T21:35:10.138Z",
    expiresAt: 1788570000,
    ...overrides,
  };
}

describe("parseReaderQuery", () => {
  it("defaults to ticketmaster with a bounded limit", () => {
    expect(parseReaderQuery({})).toEqual({ provider: "ticketmaster", limit: 20 });
    expect(parseReaderQuery({ provider: "Ticketmaster", limit: "35" })).toEqual({
      provider: "ticketmaster",
      limit: 35,
    });
  });

  it("rejects unsupported providers and invalid limits", () => {
    expect(() => parseReaderQuery({ provider: "ecs-demo-provider" })).toThrow(
      "Unsupported provider.",
    );
    expect(() => parseReaderQuery({ limit: "0" })).toThrow("limit must be an integer");
    expect(() => parseReaderQuery({ limit: "51" })).toThrow("limit must be an integer");
  });
});

describe("toPublicExternalEvent", () => {
  it("maps a DynamoDB item to sanitized display fields and omits internal timestamps", () => {
    const pub = toPublicExternalEvent(ticketmasterItem());
    expect(pub).toEqual({
      provider: "ticketmaster",
      externalId: "Z7r9jZ1Ad8eP8",
      title: "Dallas Symphony at the Meyerson",
      startsAt: "2026-09-16T00:30:00.000Z",
      city: "Dallas",
      state: "TX",
      venueName: "Morton H. Meyerson Symphony Center",
      sourceUrl: "https://www.ticketmaster.com/event/Z7r9jZ1Ad8eP8",
      imageUrl: "https://s1.ticketm.net/dam/a/event/hero-2048.jpg",
      category: "Music",
      genre: "Classical",
      latitude: 32.7767,
      longitude: -96.797,
    });
    expect(pub).not.toHaveProperty("ingestedAt");
    expect(pub).not.toHaveProperty("updatedAt");
    expect(pub).not.toHaveProperty("expiresAt");
  });

  it("omits missing optional fields without failing", () => {
    const pub = toPublicExternalEvent(
      ticketmasterItem({
        venueName: " ",
        imageUrl: undefined,
        category: undefined,
        genre: undefined,
        latitude: undefined,
        longitude: undefined,
        sourceUrl: "http://insecure.example",
      }),
    );
    expect(pub?.title).toBe("Dallas Symphony at the Meyerson");
    expect(pub?.venueName).toBeUndefined();
    expect(pub?.imageUrl).toBeUndefined();
    expect(pub?.sourceUrl).toBeUndefined();
  });
});

describe("selectFutureExternalEvents", () => {
  it("filters past events, sorts by startsAt, and applies the limit", () => {
    const selected = selectFutureExternalEvents(
      [
        ticketmasterItem({
          externalId: "later",
          title: "Later",
          startsAt: "2026-11-01T00:00:00.000Z",
        }),
        ticketmasterItem({
          externalId: "past",
          title: "Past",
          startsAt: "2026-08-01T00:00:00.000Z",
        }),
        ticketmasterItem({
          externalId: "soon",
          title: "Soon",
          startsAt: "2026-09-01T00:00:00.000Z",
        }),
        ticketmasterItem({
          externalId: "bad-date",
          title: "Bad",
          startsAt: "not-a-date",
        }),
        ticketmasterItem({
          externalId: "missing-title",
          title: " ",
        }),
      ],
      NOW,
      1,
    );

    expect(selected.map((event) => event.externalId)).toEqual(["soon"]);
  });
});

describe("processReaderRequest", () => {
  it("queries provider=ticketmaster and returns sanitized future events", async () => {
    const queried: string[] = [];
    const store: ExternalEventsStore = {
      async queryByProvider(provider) {
        queried.push(provider);
        return [
          ticketmasterItem({ startsAt: "2026-08-01T00:00:00.000Z", externalId: "past" }),
          ticketmasterItem(),
        ];
      },
    };

    const response = await processReaderRequest(
      { requestContext: { http: { method: "GET" } }, queryStringParameters: {} },
      store,
      NOW,
    );

    expect(queried).toEqual(["ticketmaster"]);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as {
      count: number;
      items: Array<Record<string, unknown>>;
    };
    expect(body.count).toBe(1);
    expect(body.items[0].externalId).toBe("Z7r9jZ1Ad8eP8");
    expect(body.items[0]).not.toHaveProperty("ingestedAt");
  });

  it("returns 400 for an unsupported provider", async () => {
    const store: ExternalEventsStore = {
      async queryByProvider() {
        throw new Error("should not query");
      },
    };
    const response = await processReaderRequest(
      {
        requestContext: { http: { method: "GET" } },
        queryStringParameters: { provider: "ecs-demo-provider" },
      },
      store,
      NOW,
    );
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ error: "Unsupported provider." });
  });

  it("returns 500 without leaking internals when DynamoDB fails", async () => {
    const store: ExternalEventsStore = {
      async queryByProvider() {
        throw new Error("User: arn:aws:iam::123:role/secret is not authorized");
      },
    };
    const response = await processReaderRequest(
      { requestContext: { http: { method: "GET" } } },
      store,
      NOW,
    );
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: "External events are temporarily unavailable.",
    });
    expect(response.body).not.toContain("arn:aws:iam");
    expect(response.body).not.toContain("123");
  });

  it("returns 405 for non-GET methods", async () => {
    const store: ExternalEventsStore = {
      async queryByProvider() {
        throw new Error("should not query");
      },
    };
    const response = await processReaderRequest(
      { requestContext: { http: { method: "POST" } } },
      store,
      NOW,
    );
    expect(response.statusCode).toBe(405);
  });

  it("applies the requested limit after sorting future events", async () => {
    const store: ExternalEventsStore = {
      async queryByProvider() {
        return [
          ticketmasterItem({ externalId: "a", startsAt: "2026-10-01T00:00:00.000Z" }),
          ticketmasterItem({ externalId: "b", startsAt: "2026-09-01T00:00:00.000Z" }),
          ticketmasterItem({ externalId: "c", startsAt: "2026-11-01T00:00:00.000Z" }),
        ];
      },
    };
    const response = await processReaderRequest(
      {
        requestContext: { http: { method: "GET" } },
        queryStringParameters: { limit: "2" },
      },
      store,
      NOW,
    );
    const body = JSON.parse(response.body) as { items: Array<{ externalId: string }> };
    expect(body.items.map((item) => item.externalId)).toEqual(["b", "a"]);
  });

  it("only reads via queryByProvider and never mutates the store", async () => {
    const store: ExternalEventsStore & {
      putItem?: unknown;
      updateItem?: unknown;
      deleteItem?: unknown;
    } = {
      async queryByProvider() {
        return [ticketmasterItem()];
      },
    };
    expect(store.putItem).toBeUndefined();
    expect(store.updateItem).toBeUndefined();
    expect(store.deleteItem).toBeUndefined();
    await processReaderRequest(
      { requestContext: { http: { method: "GET" } } },
      store,
      NOW,
    );
    expect(Object.keys(store)).toEqual(["queryByProvider"]);
  });
});
