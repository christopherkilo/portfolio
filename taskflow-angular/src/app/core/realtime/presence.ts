export type PresenceUser = {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  workspaceId: string;
  currentView?: string;
  currentEntityId?: string | null;
  lastActiveAt: string;
};

/** Presence is ephemeral Realtime state — never persisted, never credentials. */
export const PRESENCE_SAFE_FIELDS = [
  "userId",
  "displayName",
  "avatarUrl",
  "workspaceId",
  "currentView",
  "currentEntityId",
  "lastActiveAt",
] as const;

const SAFE = new Set<string>(PRESENCE_SAFE_FIELDS);

export function sanitizePresencePayload(
  input: Record<string, unknown>,
): PresenceUser | null {
  const userId = input["userId"];
  const displayName = input["displayName"];
  const workspaceId = input["workspaceId"];
  if (typeof userId !== "string" || !userId) return null;
  if (typeof displayName !== "string" || !displayName) return null;
  if (typeof workspaceId !== "string" || !workspaceId) return null;
  const lastActiveAtRaw = input["lastActiveAt"];
  const lastActiveAt =
    typeof lastActiveAtRaw === "string"
      ? lastActiveAtRaw
      : new Date().toISOString();
  const payload: PresenceUser = {
    userId,
    displayName,
    workspaceId,
    lastActiveAt,
  };
  const avatarUrl = input["avatarUrl"];
  if (typeof avatarUrl === "string" || avatarUrl === null) {
    payload.avatarUrl = avatarUrl;
  }
  const currentView = input["currentView"];
  if (typeof currentView === "string") {
    payload.currentView = currentView;
  }
  const currentEntityId = input["currentEntityId"];
  if (typeof currentEntityId === "string" || currentEntityId === null) {
    payload.currentEntityId = currentEntityId;
  }
  for (const key of Object.keys(payload)) {
    if (!SAFE.has(key)) {
      delete (payload as Record<string, unknown>)[key];
    }
  }
  return payload;
}

export function presenceUsersFromState(
  state: Record<string, unknown>,
): PresenceUser[] {
  const users: PresenceUser[] = [];
  for (const key of Object.keys(state)) {
    const metas = state[key] as unknown;
    const first = Array.isArray(metas) ? metas[0] : null;
    if (!first || typeof first !== "object") continue;
    const user = sanitizePresencePayload(first as Record<string, unknown>);
    if (user?.userId) users.push(user);
  }
  return users;
}
