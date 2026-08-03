import { handleRouteError, jsonSuccess } from "@/server/api/http";
import { eventIdSchema } from "@/server/schemas/eventHorizon";
import { getEvent } from "@/server/services/eventService";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const eventId = eventIdSchema.parse(id);
    const data = await getEvent(eventId);
    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
