import { formatHistoryEvent } from "./history-format";
import type { ActivityEventRow } from "../api/models";

function event(overrides: Partial<ActivityEventRow>): ActivityEventRow {
  return {
    id: "e1",
    workspace_id: "ws-1",
    actor_id: "user-1",
    action: "updated",
    entity_type: "task",
    entity_id: "t1",
    entity_title: "Write launch checklist",
    old_value: null,
    new_value: null,
    summary: "updated Write launch checklist",
    created_at: "2026-09-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("formatHistoryEvent", () => {
  it("formats a known status move", () => {
    const formatted = formatHistoryEvent(
      event({
        action: "moved",
        changes: {
          status: { from: "in-progress", to: "done" },
        },
      }),
      "Sarah",
    );
    expect(formatted.heading).toBe("Moved");
    expect(formatted.detail).toContain("Sarah");
    expect(formatted.detail).toContain("In Progress");
    expect(formatted.detail).toContain("Done");
    expect(formatted.detail).not.toContain("{");
  });

  it("formats an unknown action from summary without crashing", () => {
    const formatted = formatHistoryEvent(
      event({
        action: "future_event",
        summary: "did a new thing",
        changes: {},
      }),
    );
    expect(formatted.heading).toBe("future_event");
    expect(formatted.detail).toBe("did a new thing");
  });
});
