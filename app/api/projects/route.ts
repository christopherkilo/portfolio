import {
  handleTaskflowRouteError,
  jsonCreated,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import {
  createProjectSchema,
  listProjectsQuerySchema,
} from "@/server/taskflow/schemas";
import {
  createProject,
  listProjects,
} from "@/server/taskflow/services";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = listProjectsQuerySchema.parse({
      workspaceId: url.searchParams.get("workspaceId"),
    });
    const data = await listProjects(parsed.workspaceId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = createProjectSchema.parse(body);
    const data = await createProject(input);
    return jsonCreated(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
