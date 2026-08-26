/** Local Ticketmaster Discovery API fixtures. Never call the live API from tests. */

export const TEST_TICKETMASTER_API_KEY = "tm-unit-test-key-not-real";

export const NOW = new Date("2026-08-26T18:00:00.000Z");

const HERO_IMAGE = {
  ratio: "16_9",
  url: "https://s1.ticketm.net/dam/a/event/hero-2048.jpg",
  width: 2048,
  height: 1152,
  fallback: false,
};

export function ticketmasterEvent(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "Z7r9jZ1Ad8eP8",
    name: "Dallas Symphony at the Meyerson",
    url: "https://www.ticketmaster.com/event/Z7r9jZ1Ad8eP8",
    images: [
      {
        ratio: "16_9",
        url: "https://s1.ticketm.net/dam/a/event/small-205.jpg",
        width: 205,
        height: 115,
        fallback: true,
      },
      {
        ratio: "3_2",
        url: "https://s1.ticketm.net/dam/a/event/portrait-640.jpg",
        width: 640,
        height: 427,
        fallback: false,
      },
      {
        ratio: "16_9",
        url: "https://s1.ticketm.net/dam/a/event/medium-1024.jpg",
        width: 1024,
        height: 576,
        fallback: false,
      },
      HERO_IMAGE,
    ],
    dates: {
      start: {
        localDate: "2026-09-15",
        localTime: "19:30:00",
        dateTime: "2026-09-16T00:30:00Z",
        dateTBA: false,
        dateTBD: false,
        timeTBA: false,
        noSpecificTime: false,
      },
      status: { code: "onsale" },
    },
    classifications: [
      {
        primary: true,
        segment: { id: "KZFzniwnSyZfZ7v7nJ", name: "Music" },
        genre: { id: "KnvZfZ7vAeA", name: "Classical" },
      },
    ],
    _embedded: {
      venues: [
        {
          name: "Morton H. Meyerson Symphony Center",
          city: { name: "Dallas" },
          state: { name: "Texas", stateCode: "TX" },
          country: { name: "United States Of America", countryCode: "US" },
          location: {
            longitude: "-96.7970",
            latitude: "32.7767",
          },
        },
      ],
    },
    ...overrides,
  };
}

export const TICKETMASTER_DISCOVERY_PAGE = {
  _embedded: {
    events: [
      ticketmasterEvent(),
      ticketmasterEvent({
        id: "Z7r9jZ1Ad8eP9",
        name: "Texas Rangers vs. Houston Astros",
        url: "https://www.ticketmaster.com/event/Z7r9jZ1Ad8eP9",
        dates: {
          start: {
            localDate: "2026-09-20",
            localTime: "19:05:00",
            dateTime: "2026-09-21T00:05:00Z",
            dateTBA: false,
            dateTBD: false,
            timeTBA: false,
            noSpecificTime: false,
          },
        },
        classifications: [
          {
            primary: true,
            segment: { id: "KZFzniwnSyZfZ7v7nE", name: "Sports" },
            genre: { id: "KnvZfZ7vAdv", name: "Baseball" },
          },
        ],
        _embedded: {
          venues: [
            {
              name: "Globe Life Field",
              city: { name: "Arlington" },
              state: { name: "Texas", stateCode: "TX" },
              location: { latitude: "32.7476", longitude: "-97.0842" },
            },
          ],
        },
      }),
      ticketmasterEvent({
        id: "Z7r9jZ1Ad8ePA",
        name: "Comedy Night in Deep Ellum",
        url: "https://www.ticketmaster.com/event/Z7r9jZ1Ad8ePA",
      }),
    ],
  },
  page: { size: 20, totalElements: 3, totalPages: 1, number: 0 },
};

export const TICKETMASTER_SKIP_CASES = {
  missingId: ticketmasterEvent({ id: " " }),
  missingTitle: ticketmasterEvent({ id: "skip-title", name: "" }),
  malformedDate: ticketmasterEvent({
    id: "skip-bad-date",
    dates: { start: { dateTime: "not-a-date", dateTBA: false, dateTBD: false } },
  }),
  tba: ticketmasterEvent({
    id: "skip-tba",
    dates: { start: { dateTBA: true, dateTime: "2026-10-01T00:00:00Z" } },
  }),
  tbd: ticketmasterEvent({
    id: "skip-tbd",
    dates: { start: { dateTBD: true, dateTime: "2026-10-01T00:00:00Z" } },
  }),
  noDate: ticketmasterEvent({
    id: "skip-no-date",
    dates: { start: { localDate: "2026-10-01" } },
  }),
  past: ticketmasterEvent({
    id: "skip-past",
    dates: {
      start: {
        dateTime: "2026-08-01T00:00:00Z",
        dateTBA: false,
        dateTBD: false,
        timeTBA: false,
      },
    },
  }),
};

export const SELECTED_IMAGE_URL = HERO_IMAGE.url;
