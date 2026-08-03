import { handleTaskflowRouteError, jsonSuccess } from "@/server/taskflow/errors/http";
import { listActivity } from "@/server/taskflow/services";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");
    if (!workspaceId) {
      return jsonSuccess([]);
    }
    const data = await listActivity(workspaceId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
