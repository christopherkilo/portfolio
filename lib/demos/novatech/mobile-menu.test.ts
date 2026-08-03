import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("NovaTech mobile menu accessibility", () => {
  const menu = read("components/demos/novatech/layout/MobileMenu.tsx");

  it("uses a non-focusable backdrop overlay instead of a button", () => {
    expect(menu).toContain('aria-hidden="true"');
    expect(menu).toContain("onClick={onClose}");
    expect(menu).toContain("absolute inset-0 bg-overlay");
    expect(menu).not.toContain('aria-label="Close menu"');
    // Backdrop must not be an interactive control outside the dialog.
    expect(menu).not.toMatch(
      /<button[^>]*className="absolute inset-0 bg-overlay/,
    );
  });

  it("keeps dialog labelling, escape close, and body scroll lock", () => {
    expect(menu).toContain('role="dialog"');
    expect(menu).toContain('aria-modal="true"');
    expect(menu).toContain('aria-labelledby="mobile-navigation-title"');
    expect(menu).toContain('id="mobile-navigation-title"');
    expect(menu).toContain('e.key === "Escape"');
    expect(menu).toContain('overflow = "hidden"');
  });

  it("traps Tab / Shift+Tab inside the dialog panel only", () => {
    expect(menu).toContain("dialogRef.current?.querySelectorAll");
    expect(menu).toContain('e.key !== "Tab"');
    expect(menu).toContain("e.shiftKey && document.activeElement === first");
    expect(menu).toContain("!e.shiftKey && document.activeElement === last");
    expect(menu).toContain("last.focus()");
    expect(menu).toContain("first.focus()");
    // Focusable query is scoped to dialogRef, not the overlay root.
    expect(menu).toMatch(
      /dialogRef\.current\?\.querySelectorAll[\s\S]*a\[href\], button:not\(\[disabled\]\)/,
    );
  });

  it("moves initial focus into the dialog and restores on close", () => {
    expect(menu).toContain("closeButtonRef.current?.focus()");
    expect(menu).toContain("returnFocusTarget?.focus()");
    expect(menu).toContain("returnFocusRef");
  });
});
