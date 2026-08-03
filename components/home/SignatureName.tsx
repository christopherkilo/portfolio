"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type SignatureNameProps = {
  name: string;
  className?: string;
};

const SHIMMER_MS = 1700;
const START_DELAY_MS = 700;
const WORD_SHIMMER_MS = 900;

/** Session guard — survive remounts; never restart after a successful finish. */
let nameShimmerFinished = false;

/**
 * One-shot name reveal.
 * Desktop: one continuous shimmer across CHRISTOPHER → KILO.
 * Mobile stacked at load: sequential word stages on one timeline.
 * After the sweep finishes, KILO settles permanently to electric yellow.
 * Responsive layout may change later — the startup animation never restarts.
 */
export function SignatureName({ name, className }: SignatureNameProps) {
  const reducedMotion = useReducedMotion();
  const [activeFull, setActiveFull] = useState(false);
  const [activeChris, setActiveChris] = useState(false);
  const [activeKilo, setActiveKilo] = useState(false);
  const [kiloLit, setKiloLit] = useState(() => nameShimmerFinished);
  /** Layout-only: updates on resize without restarting the shimmer. */
  const [stackedLayout, setStackedLayout] = useState(false);
  /** Beam timeline captured once when startup begins; cleared when finished. */
  const [timelineMode, setTimelineMode] = useState<"full" | "stacked" | null>(
    null,
  );

  const upper = name.toUpperCase();
  const kiloIndex = upper.lastIndexOf("KILO");
  const before = kiloIndex >= 0 ? upper.slice(0, kiloIndex).trimEnd() : upper;
  const kilo = kiloIndex >= 0 ? upper.slice(kiloIndex) : "";

  // Prefer reduced-motion / completed session without cascading setState in effects.
  const showKiloLit = Boolean(reducedMotion) || kiloLit || nameShimmerFinished;

  useEffect(() => {
    if (reducedMotion === true) {
      nameShimmerFinished = true;
    }
  }, [reducedMotion]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setStackedLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion === true) return;
    // Wait until Framer has resolved the preference (null during SSR/hydration).
    if (reducedMotion !== false) return;
    if (nameShimmerFinished) return;

    // Capture layout once for this startup run — independent of later resizes.
    const useStackedTimeline =
      window.matchMedia("(max-width: 639px)").matches && Boolean(kilo);
    const mode = useStackedTimeline ? "stacked" : "full";
    const startId = window.setTimeout(() => {
      setTimelineMode(mode);
    }, 0);

    const timers: number[] = [startId];

    if (useStackedTimeline) {
      const kiloDoneAt = START_DELAY_MS + WORD_SHIMMER_MS * 2;
      timers.push(
        window.setTimeout(() => setActiveChris(true), START_DELAY_MS),
        window.setTimeout(
          () => setActiveChris(false),
          START_DELAY_MS + WORD_SHIMMER_MS,
        ),
        window.setTimeout(
          () => setActiveKilo(true),
          START_DELAY_MS + WORD_SHIMMER_MS,
        ),
        window.setTimeout(() => setActiveKilo(false), kiloDoneAt + 40),
        window.setTimeout(() => {
          nameShimmerFinished = true;
          setKiloLit(true);
          setTimelineMode(null);
        }, kiloDoneAt),
      );
    } else {
      const doneAt = START_DELAY_MS + SHIMMER_MS;
      timers.push(
        window.setTimeout(() => setActiveFull(true), START_DELAY_MS),
        window.setTimeout(() => setActiveFull(false), doneAt + 40),
        window.setTimeout(() => {
          nameShimmerFinished = true;
          setKiloLit(true);
          setTimelineMode(null);
        }, doneAt),
      );
    }

    return () => {
      for (const id of timers) window.clearTimeout(id);
      // Strict Mode abort before finish — allow a single genuine startup retry.
      // After finish, nameShimmerFinished stays true so resize/remount never replays.
      if (!nameShimmerFinished) {
        setTimelineMode(null);
        setActiveFull(false);
        setActiveChris(false);
        setActiveKilo(false);
      }
    };
  }, [reducedMotion, kilo]);

  const showStackedBeams = timelineMode === "stacked";
  const showFullBeam = timelineMode === "full";

  return (
    <span
      className={cn("signature-name relative inline-block", className)}
      data-shimmer-timeline="sequential"
      data-shimmer-order="christopher-then-kilo"
      data-shimmer-layout={stackedLayout ? "stacked" : "inline"}
      data-shimmer-once="true"
    >
      <span className="signature-name__surface relative inline">
        <span
          className="relative inline-block text-text"
          data-name-part="christopher"
        >
          {before}
          {!reducedMotion && showStackedBeams ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
              data-shimmer-layer="decorative"
            >
              <span
                className={cn(
                  "shimmer-beam shimmer-beam--name",
                  activeChris && "shimmer-beam--active",
                )}
                data-shimmer-stage="christopher"
              />
            </span>
          ) : null}
        </span>

        {kilo ? (
          <>
            <span className="signature-name__gap" aria-hidden="true">
              {" "}
            </span>
            <span
              className={cn(
                "signature-name__break signature-name__kilo relative inline-block",
                showKiloLit && "signature-name__kilo--lit",
              )}
              data-name-part="kilo"
              data-kilo-final={showKiloLit ? "lit" : "pending"}
            >
              {kilo}
              {!reducedMotion && showStackedBeams ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                  data-shimmer-layer="decorative"
                >
                  <span
                    className={cn(
                      "shimmer-beam shimmer-beam--name",
                      activeKilo && "shimmer-beam--active",
                    )}
                    data-shimmer-stage="kilo"
                  />
                </span>
              ) : null}
            </span>
          </>
        ) : null}

        {!reducedMotion && showFullBeam ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
            data-shimmer-layer="decorative"
          >
            <span
              className={cn(
                "shimmer-beam shimmer-beam--name",
                activeFull && "shimmer-beam--active",
              )}
              data-shimmer-stage="full-name"
            />
          </span>
        ) : null}
      </span>
    </span>
  );
}
