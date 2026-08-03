import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { markNotificationRead } from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ notificationId: string }> };

export async function PATCH(_request: Request, { params }: Params) {
  try {
    const { notificationId } = await params;
    const data = await markNotificationRead(notificationId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
