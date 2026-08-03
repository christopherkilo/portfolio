import { handleTaskflowRouteError, jsonSuccess } from "@/server/taskflow/errors/http";
import { listMembers } from "@/server/taskflow/services";
import { ValidationError } from "@/server/taskflow/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const workspaceId = new URL(request.url).searchParams.get("workspaceId");
    if (!workspaceId) {
      throw new ValidationError("workspaceId is required.", {
        workspaceId: ["workspaceId is required."],
      });
    }
    const data = await listMembers(workspaceId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
