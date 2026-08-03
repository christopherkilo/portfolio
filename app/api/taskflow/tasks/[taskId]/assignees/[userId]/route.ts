import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { unassignTask } from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ taskId: string; userId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { taskId, userId } = await params;
    const data = await unassignTask(taskId, userId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
