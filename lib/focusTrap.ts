/** Shared focus-trap helpers for dialogs, the mobile nav, and lightboxes. */

export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => {
    if (element.closest('[aria-hidden="true"]')) return false;
    if (element.getAttribute("aria-hidden") === "true") return false;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return true;
  });
}

/**
 * Keep Tab / Shift+Tab cycling inside `container`.
 * Returns true when the event was handled (preventDefault already applied).
 */
export function handleFocusTrapTab(
  event: KeyboardEvent,
  container: HTMLElement,
): boolean {
  if (event.key !== "Tab") return false;

  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return true;
  }

  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  const active = document.activeElement;

  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault();
    last.focus();
    return true;
  }

  if (!event.shiftKey && (active === last || !container.contains(active))) {
    event.preventDefault();
    first.focus();
    return true;
  }

  return false;
}

export function focusFirstElement(container: HTMLElement): void {
  const autofocus = container.querySelector<HTMLElement>("[data-autofocus]");
  if (autofocus) {
    autofocus.focus();
    return;
  }
  const focusable = getFocusableElements(container);
  (focusable[0] ?? container).focus();
}
