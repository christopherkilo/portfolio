import { handleRouteError, jsonSuccess } from "@/server/api/http";
import { requireSessionUser } from "@/server/auth/session";
import { reservationCancelSchema } from "@/server/schemas/eventHorizon";
import { cancelReservation } from "@/server/services/reservationService";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const parsed = reservationCancelSchema.parse({ id });
    const data = await cancelReservation(user.id, parsed.id);
    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
