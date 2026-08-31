import type { Page } from "@playwright/test";

export async function assertNoHorizontalOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
    };
  });
  if (scrollWidth > clientWidth + 1) {
    throw new Error(
      `Unexpected horizontal overflow: scrollWidth ${scrollWidth} > clientWidth ${clientWidth}`,
    );
  }
}
