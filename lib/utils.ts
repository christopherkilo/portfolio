import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** True when a Next/Image `src` is an SVG (skip optimizer; keep raster optimizable). */
export function isSvgImageSrc(src: string): boolean {
  return /\.svg(?:$|\?)/i.test(src);
}
