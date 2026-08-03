import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { listAttachments } from "@/server/taskflow/services";

export const runtime = "nodejs";
type Params = { params: Promise<{ taskId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    return jsonSuccess(await listAttachments(taskId));
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
