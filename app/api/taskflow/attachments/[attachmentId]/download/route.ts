import {
  handleTaskflowRouteError,
  jsonSuccess,
} from "@/server/taskflow/errors/http";
import { getAttachmentDownloadUrl } from "@/server/taskflow/services";

export const runtime = "nodejs";
type Params = { params: Promise<{ attachmentId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { attachmentId } = await params;
    return jsonSuccess(await getAttachmentDownloadUrl(attachmentId));
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
