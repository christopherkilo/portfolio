import {
  handleTaskflowRouteError,
  jsonSuccess,
  readJsonBody,
} from "@/server/taskflow/errors/http";
import { acceptInvitationSchema } from "@/server/taskflow/schemas";
import { acceptInvitation } from "@/server/taskflow/services";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = acceptInvitationSchema.parse(body);
    const data = await acceptInvitation(input);
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
