import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { revokeInvitation } from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ workspaceId: string; invitationId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { workspaceId, invitationId } = await params;
    const data = await revokeInvitation(workspaceId, invitationId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
