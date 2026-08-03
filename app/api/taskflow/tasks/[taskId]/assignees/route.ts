import {
  handleTaskflowRouteError,
  jsonCreated,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { assignTaskSchema } from "@/server/taskflow/schemas";
import { assignTask } from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ taskId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const body = await readJsonBody(request);
    const input = assignTaskSchema.parse(body);
    const data = await assignTask(taskId, input.userId);
    return jsonCreated(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
