import {
  handleTaskflowRouteError,
  jsonCreated,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import {
  createTaskSchema,
  listTasksQuerySchema,
} from "@/server/taskflow/schemas";
import {
  createTask,
  listTasks,
} from "@/server/taskflow/services";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = listTasksQuerySchema.parse({
      workspaceId: url.searchParams.get("workspaceId"),
      projectId: url.searchParams.get("projectId") ?? undefined,
    });
    const data = await listTasks(parsed.workspaceId, parsed.projectId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = createTaskSchema.parse(body);
    const data = await createTask(input);
    return jsonCreated(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
