import type { Locator, Page } from "@playwright/test";

export async function focusedInside(page: Page, container: Locator) {
  return container.evaluate((node) => node.contains(document.activeElement));
}
