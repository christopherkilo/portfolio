import {
  handleRouteError,
  jsonCreated,
  jsonSuccess,
  readJsonBody,
} from "@/server/api/http";
import { requireSessionUser } from "@/server/auth/session";
import {
  reservationCreateSchema,
  reservationListQuerySchema,
} from "@/server/schemas/eventHorizon";
import {
  createReservation,
  listUserReservations,
} from "@/server/services/reservationService";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const url = new URL(request.url);
    const query = reservationListQuerySchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );
    const data = await listUserReservations(user.id, query);
    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await readJsonBody(request);
    const input = reservationCreateSchema.parse(body);
    const data = await createReservation(user.id, input);
    return data.replayed ? jsonSuccess(data) : jsonCreated(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
