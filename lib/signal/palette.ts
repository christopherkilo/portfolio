/**
 * Signal Magazine — refined editorial palette.
 * Same identity as the original system, with higher chroma and clearer hierarchy.
 */
export const SIGNAL_PALETTE = {
  /** Hot Signal orange — primary brand / issue accent */
  orange: "#FF4F00",
  /** Richer editorial cobalt — section markers, secondary accent */
  cobalt: "#2160D4",
  /** Warm highlight — charts, selective energy beats */
  flame: "#FF8A1A",
  /** Paper ground */
  paper: "#FAF7F2",
  /** Structural rich black */
  ink: "#111111",
  /** Long-form body on paper */
  body: "#1F1E1B",
  /** Captions / folios / metadata */
  caption: "#6F6960",
  /** Case-study hero / dark fields */
  hero: "#100E0C",
  /** Soft cream on dark surfaces */
  onInk: "#FAF7F2",
  /** Secondary copy on dark */
  onInkMuted: "#D6D0C6",
  /** Soft supporting on dark */
  onInkSoft: "#E6E0D6",
  /** Bright meta values on dark */
  onInkBright: "#F2EDE5",
} as const;

export type SignalPaletteKey = keyof typeof SIGNAL_PALETTE;
