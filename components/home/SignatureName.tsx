"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type SignatureNameProps = {
  name: string;
  className?: string;
};

const SHIMMER_MS = 1700;

/**
 * One-shot name reveal using the same glass shimmer beam as the rest of the UI.
 * Plays once on load — never on hover, never loops.
 */
export function SignatureName({ name, className }: SignatureNameProps) {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [kiloLit, setKiloLit] = useState(false);

  const upper = name.toUpperCase();
  const kiloIndex = upper.lastIndexOf("KILO");
  const before = kiloIndex >= 0 ? upper.slice(0, kiloIndex) : upper;
  const kilo = kiloIndex >= 0 ? upper.slice(kiloIndex) : "";

  useEffect(() => {
    if (reducedMotion) {
      setKiloLit(true);
      return;
    }

    const start = window.setTimeout(() => setActive(true), 700);
    const kiloAt = window.setTimeout(
      () => setKiloLit(true),
      700 + Math.round(SHIMMER_MS * 0.78),
    );
    const end = window.setTimeout(
      () => setActive(false),
      700 + SHIMMER_MS + 40,
    );

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(kiloAt);
      window.clearTimeout(end);
    };
  }, [reducedMotion]);

  return (
    <span className={cn("signature-name relative inline-block", className)}>
      <span className="relative inline-block">
        <span>{before}</span>
        {kilo ? (
          <span
            className={cn(
              "signature-name__kilo relative inline-block",
              kiloLit && "signature-name__kilo--lit",
            )}
          >
            {kilo}
          </span>
        ) : null}

        {!reducedMotion ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <span
              className={cn(
                "shimmer-beam shimmer-beam--name",
                active && "shimmer-beam--active",
              )}
            />
          </span>
        ) : null}
      </span>
    </span>
  );
}
