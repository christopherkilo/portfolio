import { expect, test } from "@playwright/test";
import { assertNoHorizontalOverflow } from "./helpers/overflow";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "short-desktop", width: 1440, height: 600 },
] as const;

test.describe("responsive smoke", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} homepage renders without horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");
      await expect(
        page.getByRole("heading", { level: 1, name: /christopher kilo/i }),
      ).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }

  test("short desktop hero CTA stays in the initial viewport", async ({ page }) => {
    for (const size of [
      { width: 1024, height: 600 },
      { width: 1280, height: 600 },
      { width: 1440, height: 600 },
    ]) {
      await page.setViewportSize(size);
      await page.goto("/");
      const cta = page.locator(".hero-cta").getByRole("link", { name: "View Projects" });
      await expect(cta).toBeVisible();
      const box = await cta.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
    }
  });

  test("normal desktop heights keep the hero composition", async ({ page }) => {
    for (const size of [
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(size);
      await page.goto("/");
      await expect(page.locator(".hero-section")).toBeVisible();
      await expect(page.locator(".hero-illustration")).toBeVisible();
      await expect(
        page.locator(".hero-cta").getByRole("link", { name: "View Projects" }),
      ).toBeVisible();
    }
  });
});
