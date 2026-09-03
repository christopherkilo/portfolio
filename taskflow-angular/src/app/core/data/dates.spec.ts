import {
  calendarCells,
  formatCalendarMonth,
  parseCalendarMonth,
} from "./dates";

describe("calendar month helpers", () => {
  it("parses and formats YYYY-MM", () => {
    const date = parseCalendarMonth("2026-12");
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(11);
    expect(formatCalendarMonth(date!)).toBe("2026-12");
  });

  it("rejects invalid months", () => {
    expect(parseCalendarMonth(null)).toBeNull();
    expect(parseCalendarMonth("2026-13")).toBeNull();
    expect(parseCalendarMonth("12-2026")).toBeNull();
  });

  it("pads a Monday-start December 2026 grid", () => {
    const cells = calendarCells(2026, 11, "monday");
    expect(cells[0]).toBeNull();
    expect(cells.find((cell) => cell?.day === 1)?.iso).toBe("2026-12-01");
    expect(cells.filter(Boolean).at(-1)?.iso).toBe("2026-12-31");
    expect(cells.length % 7).toBe(0);
  });
});
