import type { Page } from "@playwright/test";

/**
 * Screenshot-only determinism. Does not change production visuals.
 * Reduced-motion emulation plus test CSS freeze remaining motion/cursor.
 */
export async function prepareVisualPage(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("portfolio-theme", "dark");
    } catch {
      /* ignore */
    }
  });
}

export async function freezeVisuals(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        animation-duration: 0s !important;
        animation-iteration-count: 1 !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      html.has-custom-cursor,
      html.has-custom-cursor * {
        cursor: auto !important;
      }
    `,
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForLoadState("domcontentloaded");
}

export async function gotoVisual(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await freezeVisuals(page);
}
