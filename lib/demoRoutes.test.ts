import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const DEMO_CASES = [
  {
    id: "event-horizon",
    demo: "/demos/event-horizon",
    caseStudy: "/projects/event-horizon",
    layout: "app/demos/event-horizon/layout.tsx",
  },
  {
    id: "novatech-solutions",
    demo: "/demos/novatech-solutions",
    caseStudy: "/projects/novatech-solutions",
    layout: "app/demos/novatech-solutions/layout.tsx",
  },
  {
    id: "taskflow",
    demo: "/demos/taskflow",
    caseStudy: "/projects/taskflow",
    layout: "app/demos/taskflow/layout.tsx",
  },
] as const;

describe("demo shell return navigation", () => {
  it("wires each demo layout to DemoShell with the correct case-study href", () => {
    for (const item of DEMO_CASES) {
      const source = readFileSync(join(root, item.layout), "utf8");
      expect(source).toContain("DemoShell");
      expect(source).toContain(`caseStudyHref="${item.caseStudy}"`);
      expect(source).not.toMatch(/localhost|127\.0\.0\.1|:300[123]/);
    }
  });

  it("keeps DemoShell return control as an internal Link", () => {
    const shell = readFileSync(
      join(root, "components/demos/DemoShell.tsx"),
      "utf8",
    );
    expect(shell).toContain('from "next/link"');
    expect(shell).toContain("caseStudyHref");
    expect(shell).toContain("Back to");
    expect(shell).not.toContain('target="_blank"');
    expect(shell).not.toContain("noopener noreferrer");
  });

  it("removes legacy duplicate case-study controls from demo chrome", () => {
    const files = [
      "components/demos/event-horizon/layout/Navbar.tsx",
      "components/demos/novatech/layout/Navbar.tsx",
      "components/demos/novatech/layout/MobileMenu.tsx",
      "components/demos/taskflow/layout/TopNav.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source).not.toContain("PORTFOLIO_CASE_STUDY");
      expect(source).not.toMatch(/Back to portfolio case study/);
      expect(source).not.toMatch(/>\s*Case study\s*</);
    }
  });

  it("exposes Open Live Demo on case-study pages via internal liveDemo", () => {
    const page = readFileSync(join(root, "app/projects/[id]/page.tsx"), "utf8");
    expect(page).toContain("Open Live Demo");
    expect(page).toContain("hasLiveDemo");
    expect(page).toContain("isInternalHref");
  });
});
