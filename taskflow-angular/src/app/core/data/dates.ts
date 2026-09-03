export function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayDateOnly(): string {
  return toDateOnly(new Date());
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const delta = Date.now() - date.getTime();
  const minutes = Math.round(delta / 60_000);
  if (Math.abs(minutes) < 1) return "just now";
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function parseCalendarMonth(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return null;
  return new Date(year, month - 1, 1);
}

export function formatCalendarMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export type CalendarCell = {
  day: number;
  iso: string;
} | null;

export function calendarCells(
  year: number,
  monthIndex: number,
  weekStart: "monday" | "sunday",
): CalendarCell[] {
  const first = new Date(year, monthIndex, 1);
  const startPad =
    weekStart === "monday" ? (first.getDay() + 6) % 7 : first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, index) => {
    const day = index - startPad + 1;
    if (day < 1 || day > daysInMonth) return null;
    const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { day, iso };
  });
}
