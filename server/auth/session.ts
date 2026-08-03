import "server-only";

import { auth } from "@/auth";
import { AuthenticationError } from "@/server/errors/AppError";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return {
    id,
    name: session.user?.name,
    email: session.user?.email,
    image: session.user?.image,
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthenticationError("Please sign in to continue.");
  return user;
}
