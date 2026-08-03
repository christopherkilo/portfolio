import {
  handleTaskflowRouteError,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { notificationPreferencesSchema } from "@/server/taskflow/schemas";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/server/taskflow/services";

export const runtime = "nodejs";

export async function GET() {
  try {
    return jsonSuccess(await getNotificationPreferences());
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = notificationPreferencesSchema.parse(body);
    return jsonSuccess(await updateNotificationPreferences(input));
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
