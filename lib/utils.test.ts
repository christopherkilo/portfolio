import { describe, expect, it } from "vitest";
import { isSvgImageSrc } from "./utils";

describe("isSvgImageSrc", () => {
  it("detects SVG paths and query strings", () => {
    expect(isSvgImageSrc("/projects/cover.svg")).toBe(true);
    expect(isSvgImageSrc("/projects/cover.SVG")).toBe(true);
    expect(isSvgImageSrc("/projects/cover.svg?v=1")).toBe(true);
  });

  it("leaves raster formats optimizable", () => {
    expect(isSvgImageSrc("/projects/cover.png")).toBe(false);
    expect(isSvgImageSrc("/projects/cover.jpg")).toBe(false);
    expect(isSvgImageSrc("/projects/cover.webp")).toBe(false);
  });
});
