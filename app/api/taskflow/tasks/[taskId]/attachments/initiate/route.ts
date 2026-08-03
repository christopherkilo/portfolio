import {
  handleTaskflowRouteError,
  jsonCreated,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { initiateAttachmentSchema } from "@/server/taskflow/schemas";
import { initiateAttachment } from "@/server/taskflow/services";

export const runtime = "nodejs";
type Params = { params: Promise<{ taskId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const body = await readJsonBody(request);
    const input = initiateAttachmentSchema.parse(body);
    return jsonCreated(await initiateAttachment(taskId, input));
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
