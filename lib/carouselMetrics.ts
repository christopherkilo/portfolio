/** Shared math for the homepage project carousel. */

export function getMaxCarouselOffset(
  trackWidth: number,
  viewportWidth: number,
): number {
  return Math.max(0, trackWidth - viewportWidth);
}

export function clampCarouselOffset(offset: number, maxOffset: number): number {
  if (maxOffset <= 0) return 0;
  return Math.min(0, Math.max(offset, -maxOffset));
}

export function getCarouselStride(itemWidth: number, gap: number): number {
  return Math.max(1, itemWidth + gap);
}

export function getMaxCarouselIndex(maxOffset: number, stride: number): number {
  if (maxOffset <= 0 || stride <= 0) return 0;
  return Math.ceil(maxOffset / stride - 1e-9);
}

export function getCarouselDestination(index: number, stride: number, maxOffset: number): number {
  return clampCarouselOffset(-index * stride, maxOffset);
}

/** Finite carousel: never wrap with modulo. */
export function clampCarouselIndex(index: number, maxIndex: number): number {
  if (!Number.isFinite(index) || maxIndex <= 0) return 0;
  return Math.min(maxIndex, Math.max(0, Math.round(index)));
}

export function getCarouselAnnouncement(
  visibleIndices: number[],
  count: number,
): string {
  if (count <= 0) return "Showing no projects";
  if (visibleIndices.length === 0) {
    return `Showing 0 of ${count} projects`;
  }
  const start = visibleIndices[0]! + 1;
  const end = visibleIndices[visibleIndices.length - 1]! + 1;
  if (start === end) {
    return `Showing project ${start} of ${count}`;
  }
  return `Showing projects ${start}–${end} of ${count}`;
}

export function getVisibleCarouselIndices({
  count,
  itemWidth,
  gap,
  offset,
  viewportWidth,
  threshold = 8,
}: {
  count: number;
  itemWidth: number;
  gap: number;
  offset: number;
  viewportWidth: number;
  threshold?: number;
}): number[] {
  const stride = getCarouselStride(itemWidth, gap);
  const visible: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const left = i * stride + offset;
    const right = left + itemWidth;
    if (right > threshold && left < viewportWidth - threshold) {
      visible.push(i);
    }
  }
  return visible;
}
