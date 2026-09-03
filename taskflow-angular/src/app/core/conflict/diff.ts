export type DiffKind =
  | "UNCHANGED"
  | "LOCAL_ONLY"
  | "SERVER_ONLY"
  | "BOTH_SAME"
  | "CONFLICTING";

export type EqualFn<T> = (a: T, b: T) => boolean;

export function classifyThreeWay<T>(
  base: T,
  local: T,
  server: T,
  equal: EqualFn<T>,
): DiffKind {
  const localChanged = !equal(local, base);
  const serverChanged = !equal(server, base);
  if (!localChanged && !serverChanged) return "UNCHANGED";
  if (localChanged && !serverChanged) return "LOCAL_ONLY";
  if (!localChanged && serverChanged) return "SERVER_ONLY";
  if (equal(local, server)) return "BOTH_SAME";
  return "CONFLICTING";
}

/**
 * Queue rows have no base snapshot. Untouched keys follow the server.
 * Touched keys that differ from latest require an explicit choice.
 */
export function classifyWithoutBase<T>(
  localTouched: boolean,
  local: T,
  server: T,
  equal: EqualFn<T>,
): DiffKind {
  if (!localTouched) return "UNCHANGED";
  if (equal(local, server)) return "BOTH_SAME";
  return "CONFLICTING";
}

export function scalarEqual<T>(a: T, b: T): boolean {
  return a === b;
}

export function trimEqual(a: string, b: string): boolean {
  return String(a ?? "").trim() === String(b ?? "").trim();
}

export function textEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeText(a) === normalizeText(b);
}

export function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").replace(/\r\n/g, "\n");
}

export function normalizeDate(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : raw;
}

export function dateEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  return normalizeDate(a) === normalizeDate(b);
}

export function estimateEqual(
  a: number | null | undefined | string,
  b: number | null | undefined | string,
): boolean {
  const left = normalizeEstimate(a);
  const right = normalizeEstimate(b);
  if (left === null && right === null) return true;
  return left === right;
}

export function normalizeEstimate(
  value: number | null | undefined | string,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function setEqual(
  a: readonly string[] | null | undefined,
  b: readonly string[] | null | undefined,
): boolean {
  const left = normalizeSet(a);
  const right = normalizeSet(b);
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

export function normalizeSet(values: readonly string[] | null | undefined): string[] {
  return [...new Set((values ?? []).filter(Boolean))].sort();
}

export function defaultMergedValue<T>(
  kind: DiffKind,
  local: T,
  server: T,
): T | undefined {
  switch (kind) {
    case "UNCHANGED":
    case "SERVER_ONLY":
      return server;
    case "LOCAL_ONLY":
    case "BOTH_SAME":
      return local;
    case "CONFLICTING":
      return undefined;
  }
}
