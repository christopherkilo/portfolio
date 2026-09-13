import { existsSync, readFileSync } from "node:fs";
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
const GALLERY = readFileSync(
  "components/projects/event-horizon-brand/EventHorizonMerchGallery.tsx",
  "utf8",
);
const APPLICATIONS = readFileSync(
  "components/projects/event-horizon-brand/EventHorizonApplicationGallery.tsx",
  "utf8",
);

describe("Event Horizon brand identity case study", () => {
  it("registers as a separate graphic-design project", () => {
    const brand = getProjectById("event-horizon-brand");
    const product = getProjectById("event-horizon");
    expect(brand?.category).toBe("design");
    expect(brand?.title).toBe("Event Horizon — Brand Identity");
    expect(brand?.href).toBe("/projects/event-horizon-brand");
    expect(brand?.image).toBe("/projects/event-horizon-brand/cover-identity.webp");
    expect(brand?.image).not.toBe("/projects/event-horizon-brand/cover.webp");
    expect(brand?.imageAlt).toContain("campaign poster");
    expect(brand?.imageAlt).not.toMatch(/merchandise table|cap, tumbler/i);
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

  it("points the Brand Identity card at an identity-first cover, not merch", () => {
    const brand = getProjectById("event-horizon-brand");
    const relative = brand?.image?.replace(/^\//, "") ?? "";
    expect(relative).toBe("projects/event-horizon-brand/cover-identity.webp");
    expect(existsSync(`public/${relative}`)).toBe(true);
    const buf = readFileSync(`public/${relative}`);
    expect(buf.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(buf.subarray(8, 12).toString("ascii")).toBe("WEBP");
    const fourcc = buf.subarray(12, 16).toString("ascii");
    let width = 0;
    let height = 0;
    if (fourcc === "VP8X") {
      width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    } else if (fourcc === "VP8 ") {
      const start = 20;
      width = buf[start + 6] | ((buf[start + 7] & 0x3f) << 8);
      height = buf[start + 8] | ((buf[start + 9] & 0x3f) << 8);
    }
    expect([width, height]).toEqual([1600, 1000]);
    expect(brand?.imageAlt).toMatch(/poster/i);
    expect(brand?.imageAlt).not.toMatch(/merchandise table|folded shirts|hoodie|tote|cap|tumbler/i);
    expect(PAGE).not.toContain('src="/projects/event-horizon-brand/cover.webp"');
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
    expect(PAGE).toContain("campaign poster, mobile product interface");
    expect(PAGE).not.toContain("merchandise arranged on a wooden table");
    expect(PAGE).toContain("object-[78%_40%]");
    expect(PAGE).toContain("<EventHorizonMerchGallery");
    expect(GALLERY).toContain("/projects/event-horizon-brand/tote.webp");
    expect(GALLERY).toContain("/projects/event-horizon-brand/shirt-front.webp");
    expect(GALLERY).toContain("/projects/event-horizon-brand/shirt-back.webp");
    expect(GALLERY).toContain("/projects/event-horizon-brand/hoodie-front.webp");
    expect(GALLERY).toContain("/projects/event-horizon-brand/hoodie-back.webp");
    expect(GALLERY).toContain("/projects/event-horizon-brand/notebook-detail.webp");
    expect(GALLERY).toContain("/projects/event-horizon-brand/event-cup.webp");
    expect(GALLERY).not.toContain("merch-table.webp");
    expect(GALLERY).not.toContain("shirt-white");
    expect(GALLERY).not.toContain("mug-light");
    expect(GALLERY).not.toContain("mug-black");
    expect(PAGE).not.toContain("eh-wordmark");
    expect(PAGE).not.toContain("increased engagement");
    expect(PAGE).toContain("View the product case study");
    expect(PAGE).toContain(
      "Each object chooses one treatment—never both.",
    );
    expect((PAGE.match(/hero\.webp/g) ?? []).length).toBe(1);
    expect(PAGE).not.toContain("Eight plates, not the full production set");
    expect(PAGE).not.toContain("eight applications that show how the system");
    expect(GALLERY).toContain("id: \"shirt\"");
    expect(GALLERY).toContain("id: \"hoodie\"");
    expect(GALLERY).not.toContain("cap.webp");
    expect(GALLERY).toContain("object-contain");
  });

  it("presents sections 11 and 12 as compact application galleries", () => {
    expect(PAGE).toContain("<EventHorizonApplicationGallery");
    expect(PAGE).toContain("BRIDGE_APPLICATIONS");
    expect(PAGE).toContain("EVENTS_APPLICATIONS");
    expect(PAGE).toContain("SYSTEM_APPLICATIONS");
    expect(PAGE).not.toContain("tickets.webp");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/credentials-events.webp");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/wayfinding-system.webp");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/ticket-sleeve.svg");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/credential-artist.svg");
    expect(PAGE).not.toContain("bridge.webp");
    expect(PAGE).not.toContain("kit-board.webp");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/digital-system.webp");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/ticketing-system.webp");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/credentials-system.webp");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/app-icon.svg");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/poster-skyline.webp");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/program-cover.webp");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/stationery-system.webp");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/letterhead.svg");
    expect(APPLICATIONS).toContain("/projects/event-horizon-brand/envelope.svg");
    expect(APPLICATIONS).toContain("object-contain");
    expect(APPLICATIONS).not.toContain("object-cover");
    expect(APPLICATIONS).not.toContain("shirt-front");
    expect(APPLICATIONS).not.toContain("hoodie");
    expect(APPLICATIONS).not.toContain("tote.webp");
    expect(APPLICATIONS).not.toContain("tumbler");
    expect(APPLICATIONS).not.toContain("cap.webp");
    expect(APPLICATIONS).toContain("h-[200px]");
    expect(APPLICATIONS).toContain("xl:grid-cols-4");
    expect(APPLICATIONS).toContain("lg:grid-cols-3");
    const bridge = APPLICATIONS.slice(
      APPLICATIONS.indexOf("export const BRIDGE_APPLICATIONS"),
      APPLICATIONS.indexOf("export const SYSTEM_APPLICATIONS"),
    );
    const system = APPLICATIONS.slice(
      APPLICATIONS.indexOf("export const SYSTEM_APPLICATIONS"),
    );
    expect(bridge).toMatch(
      /id: "credentials"[\s\S]*?views: \[[\s\S]*?id: "credentials-system"/,
    );
    expect(bridge).toMatch(
      /id: "ticketing"[\s\S]*?views: \[[\s\S]*?id: "ticketing-system"/,
    );
    expect(bridge).toMatch(
      /id: "digital-product"[\s\S]*?views: \[[\s\S]*?id: "digital-system"/,
    );
    expect(system).toMatch(
      /id: "system-credentials"[\s\S]*?views: \[[\s\S]*?id: "credential-vip"/,
    );
    expect(system).toMatch(
      /id: "system-ticketing"[\s\S]*?views: \[[\s\S]*?id: "ticket-ga"/,
    );
    expect(system).toMatch(
      /id: "system-digital"[\s\S]*?views: \[[\s\S]*?id: "digital-tablet"/,
    );
    expect(system).toContain("credentials-system.webp");
    expect(system).toContain("ticketing-system.webp");
    expect(system).toContain("digital-system.webp");
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
      "shirt-front": [1200, 1440],
      "shirt-back": [1200, 1440],
      "hoodie-front": [1200, 1440],
      "hoodie-back": [1200, 1440],
      tote: [1024, 1024],
      "notebook-hero": [1024, 1024],
      "notebook-detail": [1800, 1200],
      tumbler: [1024, 1024],
      "event-cup": [1200, 1440],
      stickers: [1400, 933],
      "staff-front": [1200, 1440],
      "staff-back": [1100, 1320],
    } as const;
    for (const [id, [width, height]] of Object.entries(expected)) {
      expect(GALLERY).toMatch(
        new RegExp(`id: "${id}"[\\s\\S]*?width: ${width},\\s*height: ${height},`),
      );
    }
    expect(GALLERY).toContain("object-contain");
    expect(GALLERY).not.toContain("object-cover");
    expect(GALLERY).toContain(
      "hollow orange ring above the EVENT HORIZON wordmark and a thin orange horizon line",
    );
  });
});
