export const TICKETMASTER_PROVIDER = "ticketmaster";

export const TICKETMASTER_EVENTS_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";

export interface IngestionMessage {
  provider: string;
  externalId: string;
  title: string;
  startsAt: string;
  city?: string;
  state?: string;
  sourceUrl?: string;
  venueName?: string;
  imageUrl?: string;
  category?: string;
  genre?: string;
  latitude?: number;
  longitude?: number;
}

export interface WorkerConfig {
  queueUrl: string;
  provider: typeof TICKETMASTER_PROVIDER;
  city: string;
  stateCode: string;
  countryCode: string;
  pageSize: number;
  ticketmasterApiKey: string;
}

export interface ProviderFetchResult {
  events: unknown[];
  received: number;
}

export interface TicketmasterImage {
  url: string;
  ratio?: string;
  width?: number;
  height?: number;
  fallback?: boolean;
}
