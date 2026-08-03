import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { deleteAttachment } from "@/server/taskflow/services";

export const runtime = "nodejs";
type Params = { params: Promise<{ attachmentId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { attachmentId } = await params;
    return jsonSuccess(await deleteAttachment(attachmentId));
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
