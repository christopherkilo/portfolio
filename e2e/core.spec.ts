import { expect, test } from "@playwright/test";
import { attachConsoleGuard } from "./helpers/console";
import { focusedInside } from "./helpers/focus";
import { assertNoHorizontalOverflow } from "./helpers/overflow";

const GITHUB_HREF = /^https:\/\/github\.com\//;
const LINKEDIN_HREF = /^https:\/\/(www\.)?linkedin\.com\//;

test.describe("portfolio e2e", () => {
  test("about, projects, blog, and contact load with visible headings", async ({
    page,
  }) => {
    const consoleGuard = attachConsoleGuard(page);
    for (const path of ["/about", "/projects", "/work", "/blog", "/contact"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await assertNoHorizontalOverflow(page);
    }
    consoleGuard.assertClean();
  });

  test("GitHub and LinkedIn hrefs are valid", async ({ page }) => {
    await page.goto("/contact");
    const github = page.getByRole("link", { name: "GitHub" });
    const linkedin = page.getByRole("link", { name: "LinkedIn" });
    await expect(github.first()).toHaveAttribute("href", GITHUB_HREF);
    await expect(linkedin.first()).toHaveAttribute("href", LINKEDIN_HREF);

    await page.goto("/");
    const footerGitHub = page
      .getByRole("contentinfo")
      .getByRole("link", { name: "GitHub" });
    const footerLinkedIn = page
      .getByRole("contentinfo")
      .getByRole("link", { name: "LinkedIn" });
    await expect(footerGitHub).toHaveAttribute("href", GITHUB_HREF);
    await expect(footerLinkedIn).toHaveAttribute("href", LINKEDIN_HREF);
  });

  test("Live Demo links have valid destinations", async ({ page }) => {
    await page.goto("/projects/event-horizon");
    await expect(page.getByRole("heading", { name: /at a glance/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /built, not mocked/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Live Demo" }).first()).toHaveAttribute(
      "href",
      "/demos/event-horizon",
    );

    await page.goto("/projects/novatech-solutions");
    await expect(page.getByRole("link", { name: "Open demo" }).first()).toHaveAttribute(
      "href",
      "/demos/novatech-solutions",
    );

    await page.goto("/projects/taskflow");
    await expect(page.getByRole("link", { name: "Live Demo" }).first()).toHaveAttribute(
      "href",
      "/demos/taskflow",
    );
  });

  test("standalone demo and toolkit shells provide a return path", async ({
    page,
  }) => {
    await page.goto("/demos/event-horizon");
    const demoBack = page.getByRole("link", {
      name: /back to event horizon case study/i,
    });
    await expect(demoBack).toBeVisible();
    await demoBack.click();
    await expect(page).toHaveURL(/\/projects\/event-horizon$/);

    await page.goto("/demos/novatech-solutions");
    await expect(
      page.getByRole("link", { name: /back to novatech solutions case study/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /portfolio home/i })).toBeVisible();

    await page.goto("/demos/taskflow");
    await expect(
      page.getByRole("link", { name: /back to taskflow case study/i }),
    ).toBeVisible();

    await page.goto("/toolkit");
    const toolkitBack = page.getByRole("link", { name: /back to portfolio/i }).first();
    await expect(toolkitBack).toBeVisible();
    await toolkitBack.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("custom cursor arms only after movement on capable desktops", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "pointer capability is asserted in Chromium");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/has-custom-cursor/);
    await page.mouse.move(420, 280);
    await expect(page.locator("html")).toHaveClass(/has-custom-cursor/);
  });

  test("theme toggle changes document theme", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /switch to (light|dark) mode/i });
    await expect(toggle).toBeVisible();
    const before = await page.locator("html").getAttribute("data-theme");
    await toggle.click();
    await expect
      .poll(async () => page.locator("html").getAttribute("data-theme"))
      .not.toBe(before);
  });

  test("mobile menu opens, traps focus, Escape closes, and restores trigger", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.focus();
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Mobile" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Close navigation" })).toBeFocused();
    await page.keyboard.press("Tab");
    expect(await focusedInside(page, dialog)).toBe(true);
    await page.keyboard.press("Shift+Tab");
    expect(await focusedInside(page, dialog)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("command palette opens, keeps focus, Escape closes, and restores trigger", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open command palette" });
    await trigger.focus();
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Command search" })).toBeFocused();
    await page.keyboard.press("Tab");
    expect(await focusedInside(page, dialog)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("screenshot lightbox opens, traps focus, Escape closes, and restores trigger", async ({
    page,
  }) => {
    // Blog articles currently have no expandable markdown images after placeholder
    // removal. Voltline application mockups use the shared case-study lightbox.
    await page.goto("/projects/voltline");
    const trigger = page.locator("#applications button").first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Tab");
    expect(await focusedInside(page, dialog)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("invalid blog tag shows the empty state", async ({ page }) => {
    await page.goto("/blog?tag=not-a-real-tag");
    await expect(page.getByText("No matching tag")).toBeVisible();
    await expect(page.getByRole("link", { name: "All posts" })).toBeVisible();
  });

  test("blog index shows browse filters, not a tag cloud", async ({ page }) => {
    await page.goto("/blog");
    const filters = page.getByRole("navigation", { name: "Filter by tag" });
    await expect(filters.getByRole("link", { name: "All" })).toBeVisible();
    await expect(filters.getByRole("link", { name: "Angular" })).toBeVisible();
    await expect(filters.getByRole("link", { name: "Graphic Design" })).toBeVisible();
    await expect(filters.getByRole("link", { name: "DynamoDB" })).toHaveCount(0);
    await expect(filters.getByRole("link", { name: "Next.js" })).toHaveCount(0);
    await filters.getByRole("button", { name: "More filters" }).click();
    await expect(filters.getByRole("link", { name: "DynamoDB" })).toBeVisible();
    await expect(page.getByText("workflow—without...")).toHaveCount(0);
  });

  test("contact mailto handoff does not claim delivery and keeps values", async ({
    page,
  }) => {
    await page.goto("/contact");
    await page.getByPlaceholder("Your name").fill("QA Tester");
    await page.getByPlaceholder("you@example.com").fill("qa@example.com");
    await page
      .getByPlaceholder("Tell me about the project or problem…")
      .fill("This is a Playwright handoff check.");
    await page.getByRole("button", { name: "Send via email" }).click();
    await expect(
      page.getByText(/your email app should now be open/i),
    ).toBeVisible();
    await expect(page.getByText(/message sent/i)).toHaveCount(0);
    await expect(page.getByPlaceholder("Your name")).toHaveValue("QA Tester");
    await expect(page.getByPlaceholder("you@example.com")).toHaveValue(
      "qa@example.com",
    );
  });

  test("reduced-motion pages retain visible content", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /christopher kilo/i }),
    ).toBeVisible();
    await expect(
      page.locator(".hero-cta").getByRole("link", { name: "View Projects" }),
    ).toBeVisible();
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("important routes have no unexpected console errors", async ({ page }) => {
    const consoleGuard = attachConsoleGuard(page);
    for (const path of [
      "/",
      "/about",
      "/projects",
      "/work",
      "/projects/event-horizon",
      "/blog",
      "/blog/taking-event-horizon-to-aws",
      "/contact",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    consoleGuard.assertClean();
  });
});
