import { handleTaskflowRouteError, jsonSuccess } from "@/server/taskflow/errors/http";
import { getCurrentUser } from "@/server/taskflow/services";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getCurrentUser();
    return jsonSuccess(data);
  } catch (error) {
    return handleTaskflowRouteError(error);
  }
}
