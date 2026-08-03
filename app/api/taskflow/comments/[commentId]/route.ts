import {
  handleTaskflowRouteError,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { updateCommentSchema } from "@/server/taskflow/schemas";
import { deleteComment, updateComment } from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ commentId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { commentId } = await params;
    const body = await readJsonBody(request);
    const input = updateCommentSchema.parse(body);
    const data = await updateComment(commentId, input);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { commentId } = await params;
    const data = await deleteComment(commentId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
