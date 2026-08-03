import {
  handleTaskflowRouteError,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { completeAttachmentSchema } from "@/server/taskflow/schemas";
import { completeAttachment } from "@/server/taskflow/services";

export const runtime = "nodejs";
type Params = { params: Promise<{ taskId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const body = await readJsonBody(request);
    const input = completeAttachmentSchema.parse(body);
    return jsonSuccess(await completeAttachment(taskId, input.attachmentId));
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
