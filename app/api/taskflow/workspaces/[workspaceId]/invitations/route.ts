import {
  handleTaskflowRouteError,
  jsonCreated,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { createInvitationSchema } from "@/server/taskflow/schemas";
import { createInvitation, listInvitations } from "@/server/taskflow/services";

export const runtime = "nodejs";

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    const data = await listInvitations(workspaceId);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    const body = await readJsonBody(request);
    const input = createInvitationSchema.parse(body);
    const data = await createInvitation(workspaceId, input);
    return jsonCreated(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
