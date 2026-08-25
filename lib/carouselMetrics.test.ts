import { describe, expect, it } from "vitest";
import {
  clampCarouselIndex,
  clampCarouselOffset,
  getCarouselAnnouncement,
  getCarouselDestination,
  getMaxCarouselIndex,
  getMaxCarouselOffset,
  getVisibleCarouselIndices,
} from "./carouselMetrics";

describe("carousel end-of-track metrics", () => {
  it("never allows translation past trackWidth - viewportWidth", () => {
    const maxOffset = getMaxCarouselOffset(1432, 1100);
    expect(maxOffset).toBe(332);
    expect(clampCarouselOffset(-2000, maxOffset)).toBe(-332);
    expect(clampCarouselOffset(40, maxOffset)).toBe(0);
    expect(getCarouselDestination(3, 364, maxOffset)).toBe(-332);
  });

  it("does not scroll when all cards fit", () => {
    expect(getMaxCarouselOffset(1000, 1200)).toBe(0);
    expect(getMaxCarouselIndex(0, 364)).toBe(0);
    expect(getCarouselDestination(2, 364, 0)).toBe(0);
  });

  it("treats partially visible cards as visible for accessibility", () => {
    const visible = getVisibleCarouselIndices({
      count: 4,
      itemWidth: 340,
      gap: 24,
      offset: 0,
      viewportWidth: 1100,
    });
    expect(visible).toEqual([0, 1, 2]);
  });
});

describe("finite carousel index clamping", () => {
  const maxIndex = 1;

  it("keeps previous at index 0 from wrapping to the end", () => {
    expect(clampCarouselIndex(0 - 1, maxIndex)).toBe(0);
  });

  it("keeps next at maxIndex from wrapping to the start", () => {
    expect(clampCarouselIndex(maxIndex + 1, maxIndex)).toBe(maxIndex);
  });

  it("does not use modulo wrapping for out-of-range indices", () => {
    expect(clampCarouselIndex(-4, 2)).toBe(0);
    expect(clampCarouselIndex(8, 2)).toBe(2);
    expect(((-1 % 3) + 3) % 3).toBe(2);
    expect(clampCarouselIndex(-1, 2)).not.toBe(2);
    expect(8 % 3).toBe(2);
    expect(clampCarouselIndex(8, 2)).not.toBe(0);
  });
});

describe("visible-range announcement", () => {
  it("describes several cards visible at once", () => {
    const start = getVisibleCarouselIndices({
      count: 4,
      itemWidth: 340,
      gap: 24,
      offset: 0,
      viewportWidth: 1100,
    });
    expect(start).toEqual([0, 1, 2]);
    expect(getCarouselAnnouncement(start, 4)).toBe("Showing projects 1–3 of 4");

    const maxOffset = getMaxCarouselOffset(4 * 340 + 3 * 24, 1100);
    const endOffset = getCarouselDestination(getMaxCarouselIndex(maxOffset, 364), 364, maxOffset);
    const end = getVisibleCarouselIndices({
      count: 4,
      itemWidth: 340,
      gap: 24,
      offset: endOffset,
      viewportWidth: 1100,
    });
    expect(end).toEqual([1, 2, 3]);
    expect(getCarouselAnnouncement(end, 4)).toBe("Showing projects 2–4 of 4");
  });

  it("uses singular copy when only one card is visible", () => {
    expect(
      getCarouselAnnouncement(
        getVisibleCarouselIndices({
          count: 4,
          itemWidth: 340,
          gap: 24,
          offset: 0,
          viewportWidth: 360,
        }),
        4,
      ),
    ).toBe("Showing project 1 of 4");
  });
});
