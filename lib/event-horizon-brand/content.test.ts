import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getCaseStudy } from "@/lib/caseStudies";
import {
  EH_BRAND,
  EH_BRAND_COLORS,
  EH_BRAND_SECTIONS,
} from "@/lib/event-horizon-brand/content";
import { getProjectById, getProjectsByCategory } from "@/lib/projectData";

const PAGE = readFileSync(
  "components/projects/event-horizon-brand/EventHorizonBrandCaseStudy.tsx",
  "utf8",
);

describe("Event Horizon brand identity case study", () => {
  it("registers as a separate graphic-design project", () => {
    const brand = getProjectById("event-horizon-brand");
    const product = getProjectById("event-horizon");
    expect(brand?.category).toBe("design");
    expect(brand?.title).toBe("Event Horizon — Brand Identity");
    expect(brand?.href).toBe("/projects/event-horizon-brand");
    expect(brand?.image).toBe("/projects/event-horizon-brand/cover.webp");
    expect(brand?.technologies).toEqual([
      "Brand Identity",
      "Campaign Design",
      "Graphic Design",
    ]);
    expect(product?.category).toBe("web");
    expect(product?.href).toBe("/projects/event-horizon");
    expect(product?.image).toBe("/projects/event-horizon-logo.svg");
    expect(getCaseStudy("event-horizon-brand")).toBeNull();
    expect(getCaseStudy("event-horizon")?.project.id).toBe("event-horizon");
    expect(getProjectsByCategory("design").map((project) => project.id)).toEqual([
      "event-horizon-brand",
      "voltline",
      "nightshift",
      "signal-magazine",
    ]);
  });

  it("keeps the locked palette and narrative sections", () => {
    expect(EH_BRAND.statement).toBe("Where nights out gather gravity.");
    expect(EH_BRAND_COLORS.map((color) => color.hex)).toEqual([
      "#0B0B0B",
      "#FF8C2B",
      "#F4F0EB",
      "#171717",
      "#232323",
      "#FF7A00",
      "#FFC27A",
      "#8A8178",
    ]);
    expect(EH_BRAND_COLORS.map((color) => color.hex).join(" ")).not.toMatch(
      /6B4DFF|purple/i,
    );
    expect(EH_BRAND_SECTIONS.map((section) => section.id)).toEqual([
      "overview",
      "problem",
      "territory",
      "identity",
      "color",
      "type",
      "language",
      "events",
      "posters",
      "merch",
      "bridge",
      "close",
      "reflection",
    ]);
  });

  it("uses curated merch and excludes inverted or rejected plates", () => {
    expect(PAGE).toContain("/projects/event-horizon-brand/hero.webp");
    expect(PAGE).toContain("/projects/event-horizon-brand/tote.webp");
    expect(PAGE).toContain("/projects/event-horizon-brand/shirt-back.webp");
    expect(PAGE).toContain("/projects/event-horizon-brand/hoodie-back.webp");
    expect(PAGE).not.toContain("merch-table.webp");
    expect(PAGE).not.toContain("shirt-white");
    expect(PAGE).not.toContain("mug-light");
    expect(PAGE).not.toContain("eh-wordmark");
    expect(PAGE).not.toContain("increased engagement");
    expect(PAGE).toContain("View the product case study");
    expect(PAGE).toContain(
      "Each object chooses one treatment—never both.",
    );
    expect((PAGE.match(/hero\.webp/g) ?? []).length).toBe(1);
    expect(PAGE).not.toContain("Eight plates, not the full production set");
    expect(PAGE).toContain("eight applications that show how the system");
  });

  it("matches locked print-eclipse geometry", () => {
    const print = readFileSync(
      "public/projects/event-horizon-brand/symbol-print.svg",
      "utf8",
    );
    const ring = readFileSync(
      "public/projects/event-horizon-brand/symbol-ring.svg",
      "utf8",
    );
    const primitives = readFileSync(
      "components/projects/event-horizon-brand/EventHorizonBrandPrimitives.tsx",
      "utf8",
    );
    expect(print).toContain('r="18"');
    expect(print).toContain('stroke-width="2.75"');
    expect(print).toContain('r="11.5"');
    expect(print).toContain("Event Horizon symbol — print / small-size eclipse");
    expect(print).not.toContain("\u0014");
    expect(ring).not.toContain('r="11.5"');
    expect(ring).toContain("Event Horizon symbol — hollow merchandise ring");
    expect(ring).not.toContain("\u0014");
    expect(primitives).toContain('r="18"');
    expect(primitives).toContain('strokeWidth="2.75"');
    expect(primitives).toContain('r="11.5"');
    expect(primitives).toContain("hollow");
    expect(primitives).toContain('aria-label="Event Horizon"');
    expect(primitives).toContain('aria-hidden="true"');
    const wordmark = primitives.slice(
      primitives.indexOf("export function PrintWordmark"),
      primitives.indexOf("export function MerchLockup"),
    );
    expect(wordmark).not.toContain("PrintEclipse");
    expect(wordmark).toContain('#FF8C2B');
    expect(wordmark).toContain("Event H");
    expect(primitives).toContain("export function MerchLockup");
    expect(PAGE).toContain("One gravitational center, two approved lockups");
    expect(PAGE).toContain("A single piece uses one treatment or the other—never both.");
    expect(PAGE).toContain("Dark field · orange O wordmark");
    expect(PAGE).toContain("<MerchLockup");
  });

  it("stores merchandise intrinsic dimensions on each plate", () => {
    const expected = {
      "shirt-back": [1200, 1440],
      "hoodie-back": [1200, 1440],
      tote: [1024, 1024],
      notebook: [1024, 1024],
      cap: [1400, 933],
      tumbler: [1024, 1024],
      stickers: [1400, 933],
      "staff-back": [1100, 1320],
    } as const;
    for (const [id, [width, height]] of Object.entries(expected)) {
      expect(PAGE).toMatch(
        new RegExp(`id: "${id}"[\\s\\S]*?width: ${width},\\s*height: ${height},`),
      );
    }
    expect(PAGE).toContain("width={item.width}");
    expect(PAGE).toContain("height={item.height}");
    expect(PAGE).toContain("width={lightbox.width}");
    expect(PAGE).toContain("height={lightbox.height}");
    expect(PAGE).not.toContain("width={1400}\n            height={1400}");
    expect(PAGE).toContain(
      "hollow orange ring above the EVENT HORIZON wordmark and a thin orange horizon line",
    );
  });
});
