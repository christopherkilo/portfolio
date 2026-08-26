import { normalizeExternalEvent } from "../lambda/event-horizon-ingestion/normalize";
import { loadWorkerConfig, requireQueueUrl } from "../workers/event-horizon-provider/src/config";
import {
  buildDemoEvents,
  DEMO_EVENTS,
  DEMO_PROVIDER,
  demoEventKeys,
} from "../workers/event-horizon-provider/src/events";
import {
  normalizeTicketmasterEvent,
  normalizeTicketmasterEvents,
  selectEventImageUrl,
} from "../workers/event-horizon-provider/src/normalize-ticketmaster";
import {
  fetchTicketmasterEvents,
  parseDiscoveryEvents,
  redactSecrets,
  sanitizedTicketmasterEndpoint,
  ticketmasterStartDateTime,
  TicketmasterProviderError,
} from "../workers/event-horizon-provider/src/providers/ticketmaster";
import { runWorker, toQueueBody } from "../workers/event-horizon-provider/src/run";
import { TICKETMASTER_EVENTS_URL } from "../workers/event-horizon-provider/src/types";
import {
  NOW,
  SELECTED_IMAGE_URL,
  TEST_TICKETMASTER_API_KEY,
  TICKETMASTER_DISCOVERY_PAGE,
  TICKETMASTER_SKIP_CASES,
  ticketmasterEvent,
} from "./fixtures/ticketmaster";

function workerEnv(overrides: NodeJS.Dict<string> = {}): NodeJS.Dict<string> {
  return {
    INGESTION_QUEUE_URL: "https://sqs.us-east-2.amazonaws.com/example/queue",
    EVENT_PROVIDER: "ticketmaster",
    EVENT_CITY: "Dallas",
    EVENT_STATE_CODE: "TX",
    EVENT_COUNTRY_CODE: "US",
    EVENT_PAGE_SIZE: "20",
    TICKETMASTER_API_KEY: TEST_TICKETMASTER_API_KEY,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status: number): Response {
  return new Response(body, { status });
}

describe("event-horizon provider worker (Phase 1/2 demo fixtures)", () => {
  it("uses deterministic provider/externalId keys across repeated runs", () => {
    const first = demoEventKeys();
    const second = demoEventKeys();

    expect(first).toHaveLength(3);
    expect(first).toEqual(second);
    expect(first.map((event) => event.provider)).toEqual([
      DEMO_PROVIDER,
      DEMO_PROVIDER,
      DEMO_PROVIDER,
    ]);
    expect(first.map((event) => event.externalId)).toEqual([
      "ecs-demo-001",
      "ecs-demo-002",
      "ecs-demo-003",
    ]);
  });

  it("generates messages that match the ingestion Lambda contract", () => {
    const now = new Date("2026-08-25T18:00:00.000Z");
    for (const event of buildDemoEvents()) {
      const body = JSON.parse(toQueueBody(event)) as unknown;
      const normalized = normalizeExternalEvent(body, now);
      expect(normalized.provider).toBe(event.provider);
      expect(normalized.externalId).toBe(event.externalId);
      expect(normalized.title).toBe(event.title);
      expect(normalized.startsAt).toBe(event.startsAt);
    }
  });

  it("uses valid future startsAt values", () => {
    const now = Date.UTC(2026, 7, 25);
    for (const event of DEMO_EVENTS) {
      const startsAt = Date.parse(event.startsAt);
      expect(Number.isNaN(startsAt)).toBe(false);
      expect(startsAt).toBeGreaterThan(now);
    }
  });
});

describe("worker configuration", () => {
  it("requires INGESTION_QUEUE_URL before execution", async () => {
    expect(() => requireQueueUrl({})).toThrow("INGESTION_QUEUE_URL is required.");
    await expect(runWorker({}, { async send() {} }, { info() {}, error() {} })).rejects.toThrow(
      "INGESTION_QUEUE_URL is required.",
    );
  });

  it("requires a Ticketmaster API key from the environment and never hardcodes one", () => {
    expect(() => loadWorkerConfig(workerEnv({ TICKETMASTER_API_KEY: "" }))).toThrow(
      "TICKETMASTER_API_KEY is required.",
    );
    const config = loadWorkerConfig(workerEnv());
    expect(config.ticketmasterApiKey).toBe(TEST_TICKETMASTER_API_KEY);
    expect(config.ticketmasterApiKey).not.toMatch(/ticketmaster-api-key/);
  });
});

describe("Ticketmaster normalization", () => {
  it("maps event.id to externalId and sets provider to ticketmaster", () => {
    const event = normalizeTicketmasterEvent(ticketmasterEvent(), NOW);
    expect(event?.provider).toBe("ticketmaster");
    expect(event?.externalId).toBe("Z7r9jZ1Ad8eP8");
  });

  it("maps event.name to title and event.url to sourceUrl", () => {
    const event = normalizeTicketmasterEvent(ticketmasterEvent(), NOW);
    expect(event?.title).toBe("Dallas Symphony at the Meyerson");
    expect(event?.sourceUrl).toBe("https://www.ticketmaster.com/event/Z7r9jZ1Ad8eP8");
  });

  it("maps venue name, city, state, and coordinates from the first embedded venue", () => {
    const event = normalizeTicketmasterEvent(ticketmasterEvent(), NOW);
    expect(event?.venueName).toBe("Morton H. Meyerson Symphony Center");
    expect(event?.city).toBe("Dallas");
    expect(event?.state).toBe("TX");
    expect(event?.latitude).toBeCloseTo(32.7767);
    expect(event?.longitude).toBeCloseTo(-96.797);
  });

  it("maps category and genre from classifications", () => {
    const event = normalizeTicketmasterEvent(ticketmasterEvent(), NOW);
    expect(event?.category).toBe("Music");
    expect(event?.genre).toBe("Classical");
  });

  it("selects a deterministic large landscape image instead of the first array element", () => {
    const images = ticketmasterEvent().images;
    expect(selectEventImageUrl(images)).toBe(SELECTED_IMAGE_URL);
    expect(selectEventImageUrl(images)).toBe(selectEventImageUrl(images));
    expect(selectEventImageUrl(images)).not.toBe(
      (images as Array<{ url: string }>)[0].url,
    );
    expect(selectEventImageUrl([])).toBeUndefined();
  });

  it("converts Ticketmaster UTC dateTime into a valid startsAt", () => {
    const event = normalizeTicketmasterEvent(ticketmasterEvent(), NOW);
    expect(event?.startsAt).toBe("2026-09-16T00:30:00.000Z");
  });

  it("skips malformed dates, missing ids, and missing titles without failing the batch", () => {
    const result = normalizeTicketmasterEvents(
      [
        ticketmasterEvent(),
        TICKETMASTER_SKIP_CASES.malformedDate,
        TICKETMASTER_SKIP_CASES.missingId,
        TICKETMASTER_SKIP_CASES.missingTitle,
      ],
      NOW,
    );
    expect(result.events).toHaveLength(1);
    expect(result.skipped).toBe(3);
    expect(result.events[0].externalId).toBe("Z7r9jZ1Ad8eP8");
  });

  it("skips TBA, TBD, no-date, and past events", () => {
    const result = normalizeTicketmasterEvents(
      [
        TICKETMASTER_SKIP_CASES.tba,
        TICKETMASTER_SKIP_CASES.tbd,
        TICKETMASTER_SKIP_CASES.noDate,
        TICKETMASTER_SKIP_CASES.past,
      ],
      NOW,
    );
    expect(result.events).toEqual([]);
    expect(result.skipped).toBe(4);
  });

  it("returns an empty result cleanly when _embedded.events is missing", () => {
    expect(parseDiscoveryEvents({})).toEqual({ events: [], received: 0 });
    expect(parseDiscoveryEvents({ _embedded: {} })).toEqual({ events: [], received: 0 });
    const result = normalizeTicketmasterEvents([], NOW);
    expect(result).toEqual({ events: [], skipped: 0 });
  });
});

describe("Ticketmaster provider client", () => {
  it("sends the Dallas/TX Discovery request without logging the API key", async () => {
    const requested: string[] = [];
    const result = await fetchTicketmasterEvents(loadWorkerConfig(workerEnv()), {
      now: NOW,
      fetchImpl: async (input) => {
        requested.push(String(input));
        return jsonResponse(TICKETMASTER_DISCOVERY_PAGE);
      },
      sleep: async () => {},
    });

    expect(result.received).toBe(3);
    expect(requested).toHaveLength(1);
    const requestedUrl = new URL(requested[0]);
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(TICKETMASTER_EVENTS_URL);
    expect(requestedUrl.searchParams.get("city")).toBe("Dallas");
    expect(requestedUrl.searchParams.get("stateCode")).toBe("TX");
    expect(requestedUrl.searchParams.get("countryCode")).toBe("US");
    expect(requestedUrl.searchParams.get("size")).toBe("20");
    expect(requestedUrl.searchParams.get("sort")).toBe("date,asc");
    expect(requestedUrl.searchParams.get("includeTBA")).toBe("no");
    expect(requestedUrl.searchParams.get("includeTBD")).toBe("no");
    expect(requestedUrl.searchParams.get("includeTest")).toBe("no");
    expect(requestedUrl.searchParams.get("startDateTime")).toBe(ticketmasterStartDateTime(NOW));
    expect(requestedUrl.searchParams.get("apikey")).toBe(TEST_TICKETMASTER_API_KEY);

    const sanitized = sanitizedTicketmasterEndpoint(requestedUrl);
    expect(sanitized).not.toContain(TEST_TICKETMASTER_API_KEY);
    expect(sanitized).not.toContain("apikey=");
  });

  it("does not expose the API key in thrown or logged error strings", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async (input) => {
      calls += 1;
      throw new Error(`upstream failed ${String(input)}`);
    };

    let thrown: unknown;
    try {
      await fetchTicketmasterEvents(loadWorkerConfig(workerEnv()), {
        now: NOW,
        fetchImpl,
        sleep: async () => {},
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(TicketmasterProviderError);
    const message = thrown instanceof Error ? thrown.message : "";
    expect(message).not.toContain(TEST_TICKETMASTER_API_KEY);
    expect(message).toContain("REDACTED");
    expect(calls).toBe(1);
  });

  it("does not retry 401/403 authentication failures", async () => {
    const fetchImpl = jest.fn(async () => textResponse("denied", 401));
    await expect(
      fetchTicketmasterEvents(loadWorkerConfig(workerEnv()), {
        now: NOW,
        fetchImpl,
        sleep: async () => {
          throw new Error("should not retry 401");
        },
      }),
    ).rejects.toThrow("Ticketmaster authentication failed (401).");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries 429 and 5xx a bounded number of times", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(textResponse("slow down", 429))
      .mockResolvedValueOnce(textResponse("unavailable", 503))
      .mockResolvedValueOnce(jsonResponse(TICKETMASTER_DISCOVERY_PAGE));
    const delays: number[] = [];

    const result = await fetchTicketmasterEvents(loadWorkerConfig(workerEnv()), {
      now: NOW,
      fetchImpl,
      sleep: async (ms) => {
        delays.push(ms);
      },
    });

    expect(result.received).toBe(3);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([600, 1200]);
  });

  it("redacts apikey from error text", () => {
    const leaked = `${TICKETMASTER_EVENTS_URL}?apikey=${TEST_TICKETMASTER_API_KEY}&city=Dallas`;
    expect(redactSecrets(leaked, TEST_TICKETMASTER_API_KEY)).not.toContain(
      TEST_TICKETMASTER_API_KEY,
    );
  });
});

describe("runWorker Ticketmaster path", () => {
  it("normalizes fixture events and sends them to the configured queue", async () => {
    const sent: string[] = [];
    const logs: Array<Record<string, unknown>> = [];
    const result = await runWorker(
      workerEnv(),
      {
        async send(queueUrl, body) {
          sent.push(`${queueUrl} ${body}`);
        },
      },
      {
        info(fields) {
          logs.push(fields);
        },
        error() {},
      },
      {
        now: NOW,
        fetchImpl: async () => jsonResponse(TICKETMASTER_DISCOVERY_PAGE),
        sleep: async () => {},
      },
    );

    expect(result).toEqual({
      received: 3,
      normalized: 3,
      skipped: 0,
      sent: 3,
      failed: [],
    });
    expect(sent).toHaveLength(3);
    expect(sent.every((entry) => entry.includes("ticketmaster"))).toBe(true);
    expect(logs).toEqual(
      expect.arrayContaining([
        { msg: "provider-fetch-start", provider: "ticketmaster" },
        { msg: "provider-events-received", count: 3 },
        { msg: "provider-events-normalized", count: 3 },
        { msg: "provider-events-skipped", count: 0 },
        {
          msg: "worker-complete",
          received: 3,
          normalized: 3,
          skipped: 0,
          sent: 3,
          failed: 0,
        },
      ]),
    );

    const body = JSON.parse(sent[0].split(" ").slice(1).join(" ")) as Record<string, unknown>;
    const ingested = normalizeExternalEvent(body, NOW);
    expect(ingested.provider).toBe("ticketmaster");
    expect(ingested.venueName).toBe("Morton H. Meyerson Symphony Center");
    expect(ingested.imageUrl).toBe(SELECTED_IMAGE_URL);
  });

  it("exits the provider path on irrecoverable Ticketmaster failures", async () => {
    await expect(
      runWorker(
        workerEnv(),
        { async send() {} },
        { info() {}, error() {} },
        {
          now: NOW,
          fetchImpl: async () => textResponse("denied", 403),
          sleep: async () => {},
        },
      ),
    ).rejects.toThrow("Ticketmaster authentication failed (403).");
  });
});
