import {
  handleTaskflowRouteError,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { updateMemberRoleSchema } from "@/server/taskflow/schemas";
import { removeMember, updateMemberRole } from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ workspaceId: string; userId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { workspaceId, userId } = await params;
    const body = await readJsonBody(request);
    const input = updateMemberRoleSchema.parse(body);
    const data = await updateMemberRole(workspaceId, userId, input);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { workspaceId, userId } = await params;
    const data = await removeMember(workspaceId, userId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
