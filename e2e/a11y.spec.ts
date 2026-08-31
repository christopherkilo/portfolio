import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/about",
  "/projects",
  "/blog",
  "/contact",
  "/projects/event-horizon",
  "/blog/taking-event-horizon-to-aws",
] as const;

test.describe("axe accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      try {
        localStorage.setItem("portfolio-theme", "dark");
      } catch {
        /* ignore */
      }
    });
  });

  for (const path of PAGES) {
    test(`${path} has no serious or critical violations`, async ({
      page,
      browserName,
    }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.evaluate(() => {
        try {
          localStorage.setItem("portfolio-theme", "dark");
        } catch {
          /* ignore */
        }
        document.documentElement.dataset.theme = "dark";
        document.documentElement.style.colorScheme = "dark";
      });
      const builder = new AxeBuilder({ page }).withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
      ]);
      // Firefox/WebKit sample glass/backdrop-filter stacks differently than
      // Chromium. Do not restyle production CSS for that engine difference.
      // Color contrast remains enforced on Chromium (the live-QA browser).
      if (browserName !== "chromium") {
        builder.disableRules(["color-contrast"]);
      }
      const results = await builder.analyze();
      const serious = results.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical",
      );
      expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
    });
  }
});
