/**
 * Safe Local Storage helpers for Event Horizon.
 * Never throw to callers — corrupted or unavailable storage returns fallbacks.
 */

export function safeParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function readLocalStorageItem(key: string): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocalStorageItem(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeLocalStorageItem(key: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch {
    /* Ignore quota / privacy mode failures. */
  }
}

/** Read + parse JSON from Local Storage; returns null on any failure. */
export function readJsonFromLocalStorage(key: string): unknown | null {
  const raw = readLocalStorageItem(key);
  if (raw == null || raw === "") return null;
  return safeParseJson(raw);
}
