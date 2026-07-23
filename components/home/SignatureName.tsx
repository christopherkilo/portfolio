"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type SignatureNameProps = {
  name: string;
  className?: string;
};

const SHIMMER_MS = 1700;
const START_DELAY_MS = 700;
const WORD_SHIMMER_MS = 900;

/**
 * One-shot name reveal.
 * Desktop: one continuous shimmer across CHRISTOPHER → KILO.
 * Mobile stacked: sequential word stages on one timeline.
 * After the sweep finishes, KILO settles permanently to electric yellow.
 */
export function SignatureName({ name, className }: SignatureNameProps) {
  const reducedMotion = useReducedMotion();
  const [activeFull, setActiveFull] = useState(false);
  const [activeChris, setActiveChris] = useState(false);
  const [activeKilo, setActiveKilo] = useState(false);
  const [kiloLit, setKiloLit] = useState(false);
  const [stacked, setStacked] = useState<boolean | null>(null);
  const surfaceRef = useRef<HTMLSpanElement>(null);

  const upper = name.toUpperCase();
  const kiloIndex = upper.lastIndexOf("KILO");
  const before = kiloIndex >= 0 ? upper.slice(0, kiloIndex).trimEnd() : upper;
  const kilo = kiloIndex >= 0 ? upper.slice(kiloIndex) : "";

  // Reduced-motion: final state immediately (CHRISTOPHER normal, KILO yellow).
  const showKiloLit = Boolean(reducedMotion) || kiloLit;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setStacked(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion || stacked === null) return;

    const timers: number[] = [];
    const useStackedTimeline = stacked && Boolean(kilo);

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
        // Persist yellow only after the KILO stage completes.
        window.setTimeout(() => setKiloLit(true), kiloDoneAt),
      );
    } else {
      const doneAt = START_DELAY_MS + SHIMMER_MS;
      timers.push(
        window.setTimeout(() => setActiveFull(true), START_DELAY_MS),
        window.setTimeout(() => setActiveFull(false), doneAt + 40),
        // Persist yellow after the full-name sweep finishes on KILO.
        window.setTimeout(() => setKiloLit(true), doneAt),
      );
    }

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [reducedMotion, stacked, kilo]);

  const isStacked = stacked === true;

  return (
    <span
      className={cn("signature-name relative inline-block", className)}
      data-shimmer-timeline="sequential"
      data-shimmer-order="christopher-then-kilo"
      data-shimmer-layout={isStacked ? "stacked" : "inline"}
    >
      <span
        ref={surfaceRef}
        className="signature-name__surface relative inline"
      >
        <span
          className="relative inline-block text-text"
          data-name-part="christopher"
        >
          {before}
          {!reducedMotion && isStacked ? (
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
              {!reducedMotion && isStacked ? (
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

        {!reducedMotion && !isStacked ? (
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
