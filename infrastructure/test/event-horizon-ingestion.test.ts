import {
  dynamoKey,
  IngestionValidationError,
  normalizeExternalEvent,
} from "../lambda/event-horizon-ingestion/normalize";
import {
  buildExternalEventUpdate,
  processSqsBatch,
  type IngestionWriter,
} from "../lambda/event-horizon-ingestion/handler";

const NOW = new Date("2026-08-25T18:00:00.000Z");

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    provider: "Ticketmaster",
    externalId: "evt-123",
    title: "  Harbor Lights Festival  ",
    city: "Cleveland",
    state: "OH",
    startsAt: "2026-09-15T23:00:00.000Z",
    sourceUrl: "https://example.com/events/harbor-lights",
    ...overrides,
  };
}

describe("normalizeExternalEvent", () => {
  it("normalizes a valid event and builds timestamps", () => {
    const record = normalizeExternalEvent(validEvent(), NOW);

    expect(record).toMatchObject({
      provider: "ticketmaster",
      externalId: "evt-123",
      title: "Harbor Lights Festival",
      city: "Cleveland",
      state: "OH",
      startsAt: "2026-09-15T23:00:00.000Z",
      sourceUrl: "https://example.com/events/harbor-lights",
      ingestedAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
    expect(record.expiresAt).toBe(
      Math.floor(new Date("2026-09-22T23:00:00.000Z").getTime() / 1000),
    );
  });

  it("rejects missing required fields", () => {
    for (const field of ["provider", "externalId", "title", "startsAt"] as const) {
      const input = validEvent({ [field]: " " });
      expect(() => normalizeExternalEvent(input, NOW)).toThrow(IngestionValidationError);
      expect(() => normalizeExternalEvent(input, NOW)).toThrow(`Missing required field: ${field}.`);
    }
  });

  it("rejects invalid timestamps", () => {
    expect(() => normalizeExternalEvent(validEvent({ startsAt: "not-a-date" }), NOW)).toThrow(
      "Invalid startsAt timestamp.",
    );
    expect(() => normalizeExternalEvent(validEvent({ startsAt: "1999-01-01T00:00:00.000Z" }), NOW)).toThrow(
      "Invalid startsAt timestamp.",
    );
    expect(() => normalizeExternalEvent(validEvent({ startsAt: "2101-01-01T00:00:00.000Z" }), NOW)).toThrow(
      "Invalid startsAt timestamp.",
    );
  });

  it("maps duplicate provider/externalId values to the same DynamoDB key", () => {
    const first = dynamoKey(" Ticketmaster ", " evt-123 ");
    const second = dynamoKey("ticketmaster", "evt-123");
    const fromRecord = normalizeExternalEvent(validEvent(), NOW);

    expect(first).toEqual(second);
    expect({ provider: fromRecord.provider, externalId: fromRecord.externalId }).toEqual({
      provider: "ticketmaster",
      externalId: "evt-123",
    });
  });
});

describe("buildExternalEventUpdate", () => {
  it("uses provider/externalId as the key and preserves ingestedAt with if_not_exists", () => {
    const record = normalizeExternalEvent(validEvent(), NOW);
    const update = buildExternalEventUpdate(record);

    expect(update.Key).toEqual({ provider: "ticketmaster", externalId: "evt-123" });
    expect(update.UpdateExpression).toContain("ingestedAt = if_not_exists(ingestedAt, :ingestedAt)");
    expect(update.UpdateExpression).toContain("updatedAt = :updatedAt");
    expect(update.ExpressionAttributeValues[":ingestedAt"]).toBe(NOW.toISOString());
    expect(update.ExpressionAttributeValues[":updatedAt"]).toBe(NOW.toISOString());
    expect(update.ExpressionAttributeValues[":title"]).toBe("Harbor Lights Festival");
  });

  it("persists optional Ticketmaster fields when present and removes them when absent", () => {
    const withOptional = normalizeExternalEvent(
      validEvent({
        venueName: "Globe Life Field",
        imageUrl: "https://s1.ticketm.net/dam/a/event/hero-2048.jpg",
        category: "Sports",
        genre: "Baseball",
        latitude: 32.7476,
        longitude: "-97.0842",
      }),
      NOW,
    );
    const withOptionalUpdate = buildExternalEventUpdate(withOptional);
    expect(withOptional.venueName).toBe("Globe Life Field");
    expect(withOptional.imageUrl).toBe("https://s1.ticketm.net/dam/a/event/hero-2048.jpg");
    expect(withOptional.category).toBe("Sports");
    expect(withOptional.genre).toBe("Baseball");
    expect(withOptional.latitude).toBeCloseTo(32.7476);
    expect(withOptional.longitude).toBeCloseTo(-97.0842);
    expect(withOptionalUpdate.UpdateExpression).toContain("venueName = :venueName");
    expect(withOptionalUpdate.UpdateExpression).toContain("latitude = :latitude");
    expect(withOptionalUpdate.UpdateExpression).not.toContain("REMOVE venueName");

    const withoutOptional = buildExternalEventUpdate(normalizeExternalEvent(validEvent(), NOW));
    expect(withoutOptional.UpdateExpression).toContain("REMOVE");
    expect(withoutOptional.UpdateExpression).toContain("venueName");
    expect(withoutOptional.UpdateExpression).toContain("imageUrl");
    expect(withoutOptional.UpdateExpression).toContain("category");
    expect(withoutOptional.UpdateExpression).toContain("genre");
    expect(withoutOptional.UpdateExpression).toContain("latitude");
    expect(withoutOptional.UpdateExpression).toContain("longitude");
    expect(withoutOptional.ExpressionAttributeValues[":venueName"]).toBeUndefined();
  });
});

describe("processSqsBatch", () => {
  it("upserts valid records and reports only failed message IDs", async () => {
    const written: string[] = [];
    const writer: IngestionWriter = {
      async upsert(record) {
        written.push(`${record.provider}#${record.externalId}`);
      },
    };

    const result = await processSqsBatch(
      {
        Records: [
          { messageId: "ok-1", body: JSON.stringify(validEvent()) },
          { messageId: "bad-json", body: "{not-json" },
          {
            messageId: "ok-2",
            body: JSON.stringify(validEvent({ provider: "ticketmaster", externalId: "evt-123" })),
          },
          { messageId: "missing-title", body: JSON.stringify(validEvent({ title: "" })) },
        ],
      },
      writer,
      NOW,
    );

    expect(written).toEqual(["ticketmaster#evt-123", "ticketmaster#evt-123"]);
    expect(result.batchItemFailures).toEqual([
      { itemIdentifier: "bad-json" },
      { itemIdentifier: "missing-title" },
    ]);
  });
});
