import { expect, test } from "@playwright/test";
import { assertNoHorizontalOverflow } from "./helpers/overflow";

const ABOUT_VIEWPORTS = [
  { name: "320", width: 320, height: 640 },
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
] as const;

test.describe("about page narrative", () => {
  test("tells the education and learning story with a single h1", async ({
    page,
  }) => {
    await page.goto("/about");

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(/hi, i'm christopher kilo/i);

    await expect(
      page.getByRole("heading", { name: /self-taught by building/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /a technical foundation, built beyond the classroom/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /davis technical college/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /job corps/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "CompTIA A+" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Web and Graphic Design", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /the project usually tells me what i need to learn next/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /using ai to learn faster without outsourcing understanding/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /when i encounter something i don't know, i know how to learn it/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Full-Stack Development" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Graphic Design", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "IT Technician" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Contact Me" }),
    ).toHaveAttribute("href", "/contact");
    await expect(
      page.getByRole("link", { name: "View Resume" }),
    ).toHaveAttribute("href", "/resume");
    await expect(
      page.getByRole("link", { name: /prompt engineering case study/i }),
    ).toHaveCount(0);

    await page.getByRole("link", { name: "Contact Me" }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await page.goto("/about");
    await page.getByRole("link", { name: "View Resume" }).click();
    await expect(page).toHaveURL(/\/resume$/);
  });

  test("keeps keyboard-focusable CTAs and reduced-motion content", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/about");

    await expect(
      page.getByRole("heading", { level: 1, name: /christopher kilo/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /when i encounter something i don't know, i know how to learn it/i,
      }),
    ).toBeVisible();

    const contact = page.getByRole("link", { name: "Contact Me" });
    await contact.focus();
    await expect(contact).toBeFocused();
  });

  for (const viewport of ABOUT_VIEWPORTS) {
    test(`does not overflow horizontally at ${viewport.name}px`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/about");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await assertNoHorizontalOverflow(page);

      const aiHeading = page.getByRole("heading", {
        name: "Using AI to learn faster without outsourcing understanding.",
        exact: true,
      });
      await aiHeading.scrollIntoViewIfNeeded();
      await expect(aiHeading).toBeVisible();
      await expect(aiHeading).toHaveText(
        "Using AI to learn faster without outsourcing understanding.",
      );
      const clipped = await aiHeading.evaluate((el) => ({
        scrollWidth: Math.round((el as HTMLElement).scrollWidth),
        clientWidth: Math.round((el as HTMLElement).clientWidth),
        scrollHeight: Math.round((el as HTMLElement).scrollHeight),
        clientHeight: Math.round((el as HTMLElement).clientHeight),
      }));
      expect(
        clipped.scrollWidth,
        `AI heading clipped horizontally at ${viewport.name}px`,
      ).toBeLessThanOrEqual(clipped.clientWidth + 1);
      expect(
        clipped.scrollHeight,
        `AI heading clipped vertically at ${viewport.name}px`,
      ).toBeLessThanOrEqual(clipped.clientHeight + 1);
    });
  }
});
