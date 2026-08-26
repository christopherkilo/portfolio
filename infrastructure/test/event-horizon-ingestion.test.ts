import {
  dynamoKey,
  IngestionValidationError,
  normalizeExternalEvent,
} from "../lambda/event-horizon-ingestion/normalize";
import {
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

describe("processSqsBatch", () => {
  it("upserts valid records and reports only failed message IDs", async () => {
    const written: string[] = [];
    const writer: IngestionWriter = {
      async put(record) {
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
