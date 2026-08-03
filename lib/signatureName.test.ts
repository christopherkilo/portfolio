import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const signaturePath = join(
  process.cwd(),
  "components/home/SignatureName.tsx",
);

describe("SignatureName shimmer sequencing", () => {
  const source = readFileSync(signaturePath, "utf8");

  it("uses one sequential shimmer timeline across the full name", () => {
    expect(source).toContain('data-shimmer-timeline="sequential"');
    expect(source).toContain('data-shimmer-order="christopher-then-kilo"');
    expect(source).toContain('data-shimmer-stage="full-name"');
    expect(source).toContain("signature-name__surface");
  });

  it("renders CHRISTOPHER before KILO in markup order", () => {
    const chris = source.indexOf('data-name-part="christopher"');
    const kilo = source.indexOf('data-name-part="kilo"');
    expect(chris).toBeGreaterThan(-1);
    expect(kilo).toBeGreaterThan(chris);
  });

  it("persists KILO’s electric-yellow final state after the shimmer", () => {
    expect(source).toContain("signature-name__kilo--lit");
    expect(source).toContain("setKiloLit(true)");
    expect(source).toContain("showKiloLit");
    expect(source).toContain('data-kilo-final={showKiloLit ? "lit" : "pending"}');
  });

  it("plays the startup shimmer only once (independent of resize/layout)", () => {
    expect(source).toContain('data-shimmer-once="true"');
    expect(source).toContain("nameShimmerFinished");
    expect(source).toContain("stackedLayout");
    // Animation effect must not depend on responsive layout state.
    expect(source).toMatch(/\}, \[reducedMotion, kilo\]\);/);
    expect(source).not.toMatch(/\}, \[reducedMotion, stacked/);
    expect(source).not.toContain("surfaceRef");
  });

  it("keeps KILO from starting until CHRISTOPHER completes in stacked mode", () => {
    expect(source).toContain('data-shimmer-stage="christopher"');
    expect(source).toContain('data-shimmer-stage="kilo"');
    expect(source).toMatch(
      /setActiveKilo\(true\),\s*START_DELAY_MS \+ WORD_SHIMMER_MS/,
    );
  });

  it("skips the traveling animation under reduced motion and shows final colors", () => {
    expect(source).toContain("reducedMotion");
    expect(source).toContain("!reducedMotion");
    expect(source).toMatch(/reducedMotion === true/);
    expect(source).toContain("Boolean(reducedMotion) || kiloLit");
  });

  it("keeps decorative shimmer layers aria-hidden", () => {
    expect(source).toContain('data-shimmer-layer="decorative"');
    expect(source).toMatch(/aria-hidden/);
  });
});
