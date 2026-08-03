import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { listMembers } from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    const data = await listMembers(workspaceId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
