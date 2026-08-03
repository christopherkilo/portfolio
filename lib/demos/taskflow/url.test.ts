import { describe, expect, it } from "vitest";
import {
  formatCalendarMonth,
  normalizeDueFilter,
  normalizePriority,
  normalizeStatus,
  normalizeViewMode,
  parseCalendarMonth,
} from "@/lib/demos/taskflow/url-state";

describe("TaskFlow URL helpers", () => {
  it("normalizes board/list view modes", () => {
    expect(normalizeViewMode("list")).toBe("list");
    expect(normalizeViewMode("board")).toBe("board");
    expect(normalizeViewMode("kanban")).toBe("board");
    expect(normalizeViewMode(null)).toBe("board");
  });

  it("parses and formats calendar months", () => {
    expect(parseCalendarMonth("2026-07")?.getFullYear()).toBe(2026);
    expect(parseCalendarMonth("2026-07")?.getMonth()).toBe(6);
    expect(parseCalendarMonth("2026-13")).toBeNull();
    expect(parseCalendarMonth("nope")).toBeNull();
    expect(formatCalendarMonth(new Date(2026, 6, 1))).toBe("2026-07");
  });

  it("normalizes task filter query values", () => {
    expect(normalizeStatus("in-progress")).toBe("in-progress");
    expect(normalizeStatus("flying")).toBe("all");
    expect(normalizePriority("high")).toBe("high");
    expect(normalizeDueFilter("week")).toBe("week");
  });
});
