import { handleRouteError, jsonSuccess } from "@/server/api/http";
import { requireSessionUser } from "@/server/auth/session";
import { eventIdSchema } from "@/server/schemas/eventHorizon";
import { removeFavorite } from "@/server/services/favoriteService";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser();
    const { eventId: raw } = await context.params;
    const eventId = eventIdSchema.parse(raw);
    const data = await removeFavorite(user.id, eventId);
    // Idempotent delete — return 200 with body for client simplicity.
    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
