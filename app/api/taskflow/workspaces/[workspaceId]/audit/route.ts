import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { getWorkspaceAudit } from "@/server/taskflow/services";

export const runtime = "nodejs";
type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    const url = new URL(request.url);
    const data = await getWorkspaceAudit(workspaceId, {
      actorId: url.searchParams.get("actorId") ?? undefined,
      entityType: url.searchParams.get("entityType") ?? undefined,
      action: url.searchParams.get("action") ?? undefined,
    });
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
