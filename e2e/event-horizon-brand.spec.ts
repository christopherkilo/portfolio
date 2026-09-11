import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { assertNoHorizontalOverflow } from "./helpers/overflow";

test.describe("Event Horizon brand identity case study", () => {
  test("reads as graphic design and does not replace the product study", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      try {
        localStorage.setItem("portfolio-theme", "dark");
      } catch {
        /* ignore */
      }
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async () => undefined },
      });
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/projects/event-horizon-brand");
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.style.colorScheme = "dark";
    });

    await expect(
      page.getByRole("heading", { level: 1, name: "Event Horizon" }),
    ).toBeVisible();
    await expect(
      page.getByText("Brand identity for a cinematic event-discovery platform."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Warm Darkness." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "View the product case study" })).toBeVisible();
    await expect(page.locator('img[src*="merch-table.webp"]')).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Copy Void color #0B0B0B" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "One gravitational center, two approved lockups" }),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: /^Event Horizon$/ })).toHaveCount(3);

    await page.getByRole("button", { name: "Copy Void color #0B0B0B" }).click();
    await expect(page.locator("[aria-live='polite']")).toHaveText("Copied Void #0B0B0B");

    const assertLightboxRatio = async (label: string, ratio: number) => {
      await page.getByRole("button", { name: `View ${label}` }).click();
      const dialog = page.getByRole("dialog", { name: label });
      await expect(dialog).toBeVisible();
      const img = dialog.locator("img");
      await expect.poll(async () => {
        return img.evaluate((el: HTMLImageElement) =>
          el.naturalHeight ? el.naturalWidth / el.naturalHeight : 0,
        );
      }).toBeCloseTo(ratio, 2);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
    };

    await page.locator("#merch").scrollIntoViewIfNeeded();
    await assertLightboxRatio("Cap", 1400 / 933);
    await assertLightboxRatio("Bottle", 1024 / 1024);
    await assertLightboxRatio("Consumer shirt back", 1200 / 1440);

    await expect(page.getByText("AWS CDK")).toHaveCount(0);
    await assertNoHorizontalOverflow(page);

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("footer")
      .analyze();
    const serious = axe.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Event Horizon" }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Event Horizon" }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/projects");
    await expect(
      page.getByRole("link", { name: /Event Horizon — Brand Identity/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Event Horizon(?! —)/ }).first(),
    ).toBeVisible();

    await page.goto("/projects/event-horizon");
    await expect(page.getByText("Full-Stack / Cloud Developer")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View the brand identity" }),
    ).toBeVisible();

    await page.goto("/demos/event-horizon");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
