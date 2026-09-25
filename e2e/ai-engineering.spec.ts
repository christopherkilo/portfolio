import { expect, test } from "@playwright/test";
import { assertNoHorizontalOverflow } from "./helpers/overflow";

const VIEWPORTS = [
  { name: "320", width: 320, height: 640 },
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
] as const;

test.describe("AI Engineering case study", () => {
  test("article, card, filter, and About CTA are wired", async ({ page }) => {
    await page.goto("/blog/ai-engineering");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "AI Engineering: Designing Reliable Human–AI Development Workflows",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "ALREADY LOCKED — DO NOT REOPEN" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "TaskFlow", exact: true }).first(),
    ).toHaveAttribute("href", "/projects/taskflow");
    await expect(
      page.getByRole("link", { name: "Event Horizon", exact: true }).first(),
    ).toHaveAttribute("href", "/projects/event-horizon");
    await expect(
      page.getByRole("link", { name: "NovaTech", exact: true }).first(),
    ).toHaveAttribute("href", "/projects/novatech-solutions");
    await expect(page.getByRole("link", { name: "About" }).first()).toHaveAttribute(
      "href",
      "/about",
    );

    await page.goto("/blog");
    const filters = page.getByRole("navigation", { name: "Filter by tag" });
    await expect(filters.getByRole("link", { name: "AI Engineering" })).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Read article: AI Engineering: Designing Reliable Human–AI Development Workflows",
      }),
    ).toBeVisible();

    await filters.getByRole("link", { name: "AI Engineering" }).click();
    await expect(page).toHaveURL(/tag=AI(?:%20|\+)Engineering/);
    await expect(
      page.getByRole("link", {
        name: "Read article: AI Engineering: Designing Reliable Human–AI Development Workflows",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Read article: Taking Event Horizon to AWS" }),
    ).toHaveCount(0);

    await page.goto("/about");
    await page.getByRole("link", { name: /ai engineering case study/i }).click();
    await expect(page).toHaveURL(/\/blog\/ai-engineering$/);
  });

  for (const viewport of VIEWPORTS) {
    test(`article has no horizontal overflow at ${viewport.name}px`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/blog/ai-engineering");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await assertNoHorizontalOverflow(page);

      const workOrder = page.locator("pre").filter({ hasText: "CURRENT STATUS" }).first();
      await workOrder.scrollIntoViewIfNeeded();
      const preBox = await workOrder.evaluate((el) => {
        const node = el as HTMLElement;
        const article = node.closest("article");
        return {
          preScrollWidth: node.scrollWidth,
          preClientWidth: node.clientWidth,
          articleScrollWidth: article?.scrollWidth ?? 0,
          articleClientWidth: article?.clientWidth ?? 0,
        };
      });
      expect(
        preBox.articleScrollWidth,
        `article overflow at ${viewport.name}px`,
      ).toBeLessThanOrEqual(preBox.articleClientWidth + 1);
    });

    test(`blog card has no horizontal overflow at ${viewport.name}px`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/blog");
      await expect(
        page.getByRole("link", {
          name: "Read article: AI Engineering: Designing Reliable Human–AI Development Workflows",
        }),
      ).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});
