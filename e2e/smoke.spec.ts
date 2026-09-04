import { expect, test } from "@playwright/test";
import { attachConsoleGuard } from "./helpers/console";
import { assertNoHorizontalOverflow } from "./helpers/overflow";

test.describe("cross-browser smoke", () => {
  test("homepage renders primary content", async ({ page }) => {
    const consoleGuard = attachConsoleGuard(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/Christopher Kilo — Software Engineer/i);
    await expect(
      page.getByRole("heading", { level: 1, name: /christopher kilo/i }),
    ).toBeVisible();
    await expect(page.locator(".hero-role")).toHaveText("Software Engineer");
    await expect(page.locator(".hero-disciplines")).toContainText(
      "Full-Stack Development",
    );
    await expect(page.locator(".hero-disciplines")).toContainText("Cloud / IT");
    await expect(page.locator(".hero-disciplines")).toContainText("Graphic Design");
    await expect(
      page.locator(".hero-cta").getByRole("link", { name: "View Projects" }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".hero-role")).toHaveText("Software Engineer");
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

  test("homepage engineering lab and all-work CTA are present", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /engineering lab/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /explore all work/i }).first(),
    ).toHaveAttribute("href", "/work");
  });

  test("All Work index loads", async ({ page }) => {
    await page.goto("/work");
    await expect(page.getByRole("heading", { level: 1, name: /all work/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /web development/i })).toBeVisible();
  });

  test("StarLenz stays on All Work as active development, not featured", async ({
    page,
  }) => {
    await page.goto("/");
    const featured = page.getByRole("region", { name: "Featured Applications" });
    await expect(featured.getByText(/starlenz/i)).toHaveCount(0);
    const proofLists = featured.getByRole("list", { name: "Verified project facts" });
    expect(await proofLists.count()).toBeGreaterThan(0);
    for (const list of await proofLists.all()) {
      expect(await list.getByRole("listitem").count()).toBeLessThanOrEqual(2);
    }
    await expect(
      page.locator("#engineering-lab").getByRole("heading", { name: /starlenz/i }),
    ).toBeVisible();

    await page.goto("/projects");
    await expect(page.getByRole("link", { name: /starlenz/i })).toHaveCount(0);

    await page.goto("/work");
    await expect(
      page.getByRole("link", { name: /starlenz/i }).first(),
    ).toBeVisible();
    await expect(page.getByText("Active development").first()).toBeVisible();
  });

  test("StarLenz case study loads", async ({ page }) => {
    await page.goto("/projects/starlenz");
    await expect(page.getByRole("heading", { name: /starlenz/i })).toBeVisible();
  });

  test("blog index and a representative article load", async ({ page }) => {
    await page.goto("/blog");
    await expect(
      page.getByRole("heading", { level: 1, name: /notes from the build/i }),
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
