import { expect, test } from "@playwright/test";
import { gotoVisual, freezeVisuals, prepareVisualPage } from "./helpers/visual";

test.beforeEach(async ({ page }) => {
  await prepareVisualPage(page);
});

test.describe("visual regression", () => {
  test("homepage desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoVisual(page, "/");
    await expect(page).toHaveScreenshot("homepage-desktop.png", {
      fullPage: false,
    });
  });

  test("homepage mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoVisual(page, "/");
    await expect(page).toHaveScreenshot("homepage-mobile.png", {
      fullPage: false,
    });
  });

  test("homepage short desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 600 });
    await gotoVisual(page, "/");
    await expect(page).toHaveScreenshot("homepage-short-desktop.png", {
      fullPage: false,
    });
  });

  test("projects desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoVisual(page, "/projects");
    await expect(page).toHaveScreenshot("projects-desktop.png", {
      fullPage: false,
    });
  });

  test("projects mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoVisual(page, "/projects");
    await expect(page).toHaveScreenshot("projects-mobile.png", {
      fullPage: false,
    });
  });

  test("blog desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoVisual(page, "/blog");
    await expect(page).toHaveScreenshot("blog-desktop.png", {
      fullPage: false,
    });
  });

  test("blog mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoVisual(page, "/blog");
    await expect(page).toHaveScreenshot("blog-mobile.png", {
      fullPage: false,
    });
  });

  test("event horizon case study", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoVisual(page, "/projects/event-horizon");
    await expect(page).toHaveScreenshot("project-event-horizon.png", {
      fullPage: false,
    });
  });

  test("blog article", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoVisual(page, "/blog/taking-event-horizon-to-aws");
    await expect(page).toHaveScreenshot("article-event-horizon-aws.png", {
      fullPage: false,
    });
  });

  test("404 page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoVisual(page, "/this-page-does-not-exist");
    await expect(page).toHaveScreenshot("not-found.png", {
      fullPage: false,
    });
  });

  test("light theme homepage", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.addInitScript(() => {
      try {
        localStorage.setItem("portfolio-theme", "light");
      } catch {
        /* ignore */
      }
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("portfolio-theme", "light");
      document.documentElement.dataset.theme = "light";
      document.documentElement.style.colorScheme = "light";
    });
    await freezeVisuals(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page).toHaveScreenshot("homepage-light.png", {
      fullPage: false,
    });
  });
});
