import "server-only";

import { UnauthorizedError } from "@/server/taskflow/errors";
import { createTaskflowServerClient } from "@/server/taskflow/supabase/server";
import type { ProfileRow } from "@/server/taskflow/types/database";

export { assertRole, roleAtLeast } from "@/server/taskflow/auth/roles";

export type TaskflowSessionUser = {
  id: string;
  email: string | null;
  profile: ProfileRow;
};

export async function getTaskflowUser(): Promise<TaskflowSessionUser | null> {
  const supabase = await createTaskflowServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const resolved: ProfileRow =
    profile ??
    ({
      id: user.id,
      email: user.email ?? null,
      display_name:
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "User",
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies ProfileRow);

  if (!profile) {
    await supabase.from("profiles").upsert({
      id: resolved.id,
      email: resolved.email,
      display_name: resolved.display_name,
      avatar_url: resolved.avatar_url,
    });
  }

  return {
    id: user.id,
    email: user.email ?? null,
    profile: resolved,
  };
}

export async function requireTaskflowUser(): Promise<TaskflowSessionUser> {
  const user = await getTaskflowUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
