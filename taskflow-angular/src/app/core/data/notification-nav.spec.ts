import { notificationTaskId } from "./notification-nav";

describe("notificationTaskId", () => {
  it("returns a task UUID for internal navigation", () => {
    expect(
      notificationTaskId({
        entityType: "task",
        entityId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("rejects arbitrary and external URLs", () => {
    expect(
      notificationTaskId({
        entityType: "task",
        entityId: "https://evil.example/phish",
      }),
    ).toBeNull();
    expect(
      notificationTaskId({
        entityType: "task",
        entityId: "javascript:alert(1)",
      }),
    ).toBeNull();
    expect(
      notificationTaskId({
        entityType: "project",
        entityId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBeNull();
  });
});
