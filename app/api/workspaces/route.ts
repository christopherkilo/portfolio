import {
  handleTaskflowRouteError,
  jsonCreated,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { createWorkspaceSchema } from "@/server/taskflow/schemas";
import {
  createWorkspace,
  ensureDefaultWorkspace,
  listWorkspaces,
} from "@/server/taskflow/services/workspaceService";

export const runtime = "nodejs";

export async function GET() {
  try {
    let data = await listWorkspaces();
    if (!data.length) {
      const created = await ensureDefaultWorkspace();
      data = [created];
    }
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = createWorkspaceSchema.parse(body);
    const data = await createWorkspace(input);
    return jsonCreated(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
