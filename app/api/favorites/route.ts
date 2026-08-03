import {
  handleRouteError,
  jsonCreated,
  jsonSuccess,
  readJsonBody,
} from "@/server/api/http";
import { requireSessionUser } from "@/server/auth/session";
import { favoriteCreateSchema } from "@/server/schemas/eventHorizon";
import {
  addFavorite,
  listUserFavorites,
} from "@/server/services/favoriteService";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const data = await listUserFavorites(user.id);
    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await readJsonBody(request);
    const input = favoriteCreateSchema.parse(body);
    const data = await addFavorite(user.id, input.eventId);
    return data.created ? jsonCreated(data) : jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
