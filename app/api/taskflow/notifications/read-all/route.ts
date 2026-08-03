import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { markAllNotificationsRead } from "@/server/taskflow/services";

export const runtime = "nodejs";

export async function POST() {
  try {
    const data = await markAllNotificationsRead();
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
