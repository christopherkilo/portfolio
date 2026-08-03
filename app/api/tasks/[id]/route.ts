import {
  handleTaskflowRouteError,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { updateTaskSchema } from "@/server/taskflow/schemas";
import {
  deleteTask,
  updateTask,
} from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const input = updateTaskSchema.parse(body);
    const data = await updateTask(id, input);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const data = await deleteTask(id);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
