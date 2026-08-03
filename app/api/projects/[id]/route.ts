import {
  handleTaskflowRouteError,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { updateProjectSchema } from "@/server/taskflow/schemas";
import { updateProject } from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const input = updateProjectSchema.parse(body);
    const data = await updateProject(id, input);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
