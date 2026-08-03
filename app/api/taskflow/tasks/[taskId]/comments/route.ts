import {
  handleTaskflowRouteError,
  jsonCreated,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { createCommentSchema } from "@/server/taskflow/schemas";
import { createComment, listComments } from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ taskId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const data = await listComments(taskId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const body = await readJsonBody(request);
    const input = createCommentSchema.parse(body);
    const data = await createComment(taskId, input);
    return jsonCreated(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
