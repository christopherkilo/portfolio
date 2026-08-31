import { expect, test } from "@playwright/test";
import { attachConsoleGuard } from "./helpers/console";
import { assertNoHorizontalOverflow } from "./helpers/overflow";

test.describe("cross-browser smoke", () => {
  test("homepage renders primary content", async ({ page }) => {
    const consoleGuard = attachConsoleGuard(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/Christopher Kilo/i);
    await expect(
      page.getByRole("heading", { level: 1, name: /christopher kilo/i }),
    ).toBeVisible();
    await expect(
      page.locator(".hero-cta").getByRole("link", { name: "View Projects" }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);
    consoleGuard.assertClean();
  });

  test("primary navigation reaches core pages", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Projects" }).click();
    await expect(page).toHaveURL(/\/projects$/);

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Blog" }).click();
    await expect(page).toHaveURL(/\/blog$/);

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact$/);
  });

  test("projects list includes StarLenz", async ({ page }) => {
    await page.goto("/projects");
    await expect(
      page.getByRole("link", { name: /starlenz/i }).first(),
    ).toBeVisible();
  });

  test("StarLenz case study loads", async ({ page }) => {
    await page.goto("/projects/starlenz");
    await expect(page.getByRole("heading", { name: /starlenz/i })).toBeVisible();
  });

  test("blog index and a representative article load", async ({ page }) => {
    await page.goto("/blog");
    await expect(
      page.getByRole("heading", { level: 1, name: /notes from the work/i }),
    ).toBeVisible();
    await page.goto("/blog/taking-event-horizon-to-aws");
    await expect(
      page.getByRole("heading", { name: /taking event horizon to aws/i }),
    ).toBeVisible();
  });

  test("branded 404 renders", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /back home/i })).toBeVisible();
  });
});
