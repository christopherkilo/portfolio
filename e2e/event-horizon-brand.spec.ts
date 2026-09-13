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
      page.getByRole("img", {
        name: "Event Horizon visual identity: campaign poster, mobile product interface, admission ticket, and VIP credential.",
      }),
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

    const assertLightboxRatio = async (label: string, dialogName: string, ratio: number) => {
      const trigger = page.getByRole("button", { name: label });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: dialogName });
      await expect(dialog).toBeVisible();
      const img = dialog.locator("img");
      await expect.poll(async () => {
        return img.evaluate((el: HTMLImageElement) =>
          el.naturalHeight ? el.naturalWidth / el.naturalHeight : 0,
        );
      }).toBeCloseTo(ratio, 2);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    };

    await page.locator("#merch").scrollIntoViewIfNeeded();
    await expect(page.locator("#merch li")).toHaveCount(8);
    await assertLightboxRatio("View Event Horizon sticker mockups", "Stickers · Set", 1400 / 933);
    await assertLightboxRatio("View Event Horizon tumbler mockup", "Tumbler · Front", 1024 / 1024);

    const shirtTrigger = page.getByRole("button", { name: "View Event Horizon T-shirt mockups" });
    await shirtTrigger.click();
    const shirtDialog = page.getByRole("dialog");
    await expect(shirtDialog).toBeVisible();
    await expect(shirtDialog).toHaveAccessibleName("T-Shirt · Front");
    await page.keyboard.press("ArrowRight");
    await expect(shirtDialog).toHaveAccessibleName("T-Shirt · Back");
    await page.keyboard.press("Tab");
    expect(
      await shirtDialog.evaluate((dialog) => dialog.contains(document.activeElement)),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(shirtDialog).toHaveCount(0);
    await expect(shirtTrigger).toBeFocused();

    await page.locator("#events").scrollIntoViewIfNeeded();
    await expect(page.locator("#events li")).toHaveCount(3);
    await expect(page.locator('#events img[src*="tickets.webp"]')).toHaveCount(0);
    const wayfindingTrigger = page.getByRole("button", {
      name: "View Event Horizon wayfinding system",
    });
    await wayfindingTrigger.click();
    const wayfindingDialog = page.getByRole("dialog");
    await expect(wayfindingDialog).toBeVisible();
    await expect(wayfindingDialog).toHaveAccessibleName("Wayfinding · System");
    await page.keyboard.press("ArrowRight");
    await expect(wayfindingDialog).toHaveAccessibleName("Wayfinding · Main stage");
    await page.keyboard.press("Escape");
    await expect(wayfindingDialog).toHaveCount(0);
    await expect(wayfindingTrigger).toBeFocused();

    await page.locator("#bridge").scrollIntoViewIfNeeded();
    await expect(page.locator("#bridge li")).toHaveCount(4);
    await expect(page.locator('#bridge img[src*="bridge.webp"]')).toHaveCount(0);
    const digitalTrigger = page.getByRole("button", {
      name: "View Event Horizon digital product applications",
    });
    await digitalTrigger.click();
    const digitalDialog = page.getByRole("dialog");
    await expect(digitalDialog).toBeVisible();
    await expect(digitalDialog).toHaveAccessibleName("Digital product · System");
    await page.keyboard.press("ArrowRight");
    await expect(digitalDialog).toHaveAccessibleName("Digital product · Mobile");
    await page.keyboard.press("Escape");
    await expect(digitalDialog).toHaveCount(0);
    await expect(digitalTrigger).toBeFocused();

    await page.locator("#close").scrollIntoViewIfNeeded();
    await expect(page.locator("#close li")).toHaveCount(6);
    await expect(page.locator('#close img[src*="kit-board.webp"]')).toHaveCount(0);
    await expect(
      page.locator("#close").getByRole("button", {
        name: /T-shirt|hoodie|cap mockup|tote|tumbler|notebook|sticker/i,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "View Event Horizon campaign poster" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "View Event Horizon stationery system" }),
    ).toBeVisible();

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
    const brandCard = page.getByRole("link", {
      name: /Event Horizon — Brand Identity/,
    });
    await expect(brandCard).toBeVisible();
    const brandThumb = brandCard.locator("img").first();
    await expect(brandThumb).toHaveAttribute(
      "alt",
      "Event Horizon brand identity with campaign poster, mobile interface, event ticket, and VIP credential",
    );
    await expect
      .poll(async () => brandThumb.evaluate((img: HTMLImageElement) => img.currentSrc))
      .toContain("cover-identity.webp");
    await expect
      .poll(async () => brandThumb.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(300);
    await expect(page.locator('#event-horizon-brand img[src*="cover.webp"]')).toHaveCount(0);
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
