import { handleRouteError, jsonSuccess } from "@/server/api/http";
import { eventQuerySchema } from "@/server/schemas/eventHorizon";
import { listEvents } from "@/server/services/eventService";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const featuredRaw = raw.featured;
    const parsed = eventQuerySchema.parse({
      ...raw,
      featured:
        featuredRaw === undefined
          ? false
          : featuredRaw === "true" || featuredRaw === "1",
    });
    const data = await listEvents(parsed);
    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
