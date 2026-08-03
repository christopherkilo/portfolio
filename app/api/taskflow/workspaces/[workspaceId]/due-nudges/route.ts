import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { maybeCreateDueDateNotifications } from "@/server/taskflow/services";

export const runtime = "nodejs";
type Params = { params: Promise<{ workspaceId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    await maybeCreateDueDateNotifications(workspaceId);
    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
