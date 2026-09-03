import { PRESENCE_SAFE_FIELDS, presenceUsersFromState, sanitizePresencePayload } from "./presence";

describe("presence payload", () => {
  const safe = {
    userId: "u1",
    displayName: "Ada Lovelace",
    workspaceId: "ws-1",
    lastActiveAt: "2026-09-01T00:00:00.000Z",
    currentView: "/tasks",
    currentEntityId: "t1",
    avatarUrl: "https://example.com/a.png",
  };

  it("exposes only the React safe field list", () => {
    expect([...PRESENCE_SAFE_FIELDS]).toEqual([
      "userId",
      "displayName",
      "avatarUrl",
      "workspaceId",
      "currentView",
      "currentEntityId",
      "lastActiveAt",
    ]);
  });

  it("drops credentials and unknown keys from tracked payloads", () => {
    const sanitized = sanitizePresencePayload({
      ...safe,
      access_token: "secret-token",
      refresh_token: "secret-refresh",
      password: "nope",
      email: "ada@example.com",
    });
    expect(sanitized).toMatchObject({
      userId: "u1",
      displayName: "Ada Lovelace",
      workspaceId: "ws-1",
    });
    expect(JSON.stringify(sanitized)).not.toContain("secret");
    expect(JSON.stringify(sanitized)).not.toContain("password");
    expect(JSON.stringify(sanitized)).not.toContain("ada@example.com");
  });

  it("collapses multi-tab metas to metas[0] only", () => {
    const users = presenceUsersFromState({
      u1: [
        { ...safe, currentView: "/tasks" },
        { ...safe, currentView: "/projects", displayName: "Ada tab 2" },
      ],
      u2: [
        {
          ...safe,
          userId: "u2",
          displayName: "Grace Hopper",
        },
      ],
    });
    expect(users).toHaveLength(2);
    expect(users[0]?.displayName).toBe("Ada Lovelace");
    expect(users[0]?.currentView).toBe("/tasks");
    expect(users[1]?.displayName).toBe("Grace Hopper");
  });
});
