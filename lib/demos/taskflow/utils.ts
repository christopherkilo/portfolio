import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function parseDateOnly(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return new Date(iso);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

export function toDateOnly(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayDateOnly() {
  return toDateOnly(new Date());
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  const date = parseDateOnly(iso);
  if (!isValidDate(date)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateLong(iso: string) {
  if (!iso) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? parseDateOnly(iso) : new Date(iso);
  if (!isValidDate(date)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(iso: string, now = new Date()) {
  if (!iso) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? parseDateOnly(iso) : new Date(iso);
  if (!isValidDate(date)) return "—";
  const diffMs = date.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (minutes < 1) return "just now";
  if (minutes < 60) return rtf.format(Math.sign(diffMs) * minutes, "minute");
  if (hours < 24) return rtf.format(Math.sign(diffMs) * hours, "hour");
  if (days < 30) return rtf.format(Math.sign(diffMs) * days, "day");
  return formatDate(iso);
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
