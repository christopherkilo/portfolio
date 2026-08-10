"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EventHorizonMark } from "@/components/demos/event-horizon/brand/EventHorizonMark";
import { cn } from "@/lib/utils";

type EventHorizonCardCoverProps = {
  className?: string;
  reducedMotion?: boolean | null;
  /** Cover motion plays only while hovered / focused. */
  active?: boolean;
};

/**
 * Portfolio cover for Event Horizon — black hole mark sits at the center of the accretion field.
 * Motion stays slow and continuous so hover feels like drift, not a kick-off.
 */
export function EventHorizonCardCover({
  className,
  reducedMotion: reducedMotionProp,
  active = false,
}: EventHorizonCardCoverProps) {
  const uid = useId().replace(/:/g, "");
  const reducedHook = useReducedMotion();
  const reduced = reducedMotionProp ?? reducedHook;
  const animate = active && !reduced;

  const ringId = `eh-cover-ring-${uid}`;
  const glowId = `eh-cover-glow-${uid}`;

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-[#07060A]",
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute left-1/2 top-[18%] size-56 -translate-x-1/2 rounded-full bg-[#FF8C2B]/[0.14] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[#FF7A00]/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(255,140,43,0.16),transparent_48%)]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-[10%] pb-[5%] pt-[3%] text-center">
        {/* Mark + rings share one origin so the black hole fills the outlined circle */}
        <div className="relative size-[7.25rem] sm:size-[8rem]">
          <svg
            className="pointer-events-none absolute inset-[-28%] h-[156%] w-[156%] opacity-70"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id={ringId} x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.12" />
                <stop offset="45%" stopColor="#FFC27A" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#FF8C2B" stopOpacity="0.18" />
              </linearGradient>
              <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF8C2B" stopOpacity="0.28" />
                <stop offset="55%" stopColor="#FF7A00" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
            </defs>

            <circle cx="50" cy="50" r="42" fill={`url(#${glowId})`} />

            <motion.g
              style={{ transformOrigin: "50px 50px" }}
              initial={false}
              animate={animate ? { rotate: 360 } : { rotate: 0 }}
              transition={
                animate
                  ? { duration: 56, repeat: Infinity, ease: "linear" }
                  : { duration: 2.4, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <ellipse
                cx="50"
                cy="50"
                rx="40"
                ry="14"
                fill="none"
                stroke={`url(#${ringId})`}
                strokeWidth="1.35"
                strokeDasharray="4 7"
              />
            </motion.g>

            <motion.g
              style={{ transformOrigin: "50px 50px" }}
              initial={false}
              animate={animate ? { rotate: -360 } : { rotate: 0 }}
              transition={
                animate
                  ? { duration: 78, repeat: Infinity, ease: "linear" }
                  : { duration: 2.8, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <ellipse
                cx="50"
                cy="50"
                rx="32"
                ry="10.5"
                fill="none"
                stroke="#FF8C2B"
                strokeOpacity="0.28"
                strokeWidth="1"
                strokeDasharray="3 6"
              />
            </motion.g>

            {/* Dust locked to the accretion plane — soft shimmer, not flicker */}
            {[
              [18, 48],
              [28, 42],
              [72, 44],
              [82, 52],
              [66, 58],
              [34, 56],
            ].map(([cx, cy], i) => (
              <motion.circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r={i % 2 === 0 ? 1.35 : 1}
                fill={i % 2 === 0 ? "#FFC27A" : "#FF8C2B"}
                initial={false}
                animate={
                  animate
                    ? { opacity: [0.28, 0.48, 0.28] }
                    : { opacity: 0.32 + (i % 3) * 0.04 }
                }
                transition={
                  animate
                    ? {
                        duration: 6.5 + i * 0.55,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.6 + i * 0.35,
                      }
                    : { duration: 0.9, ease: "easeOut" }
                }
              />
            ))}

            {/* Horizon pulses — long fade, pause between cycles so the loop doesn’t hitch */}
            {[
              { delay: 1.2, r: [20, 42], duration: 7.5 },
              { delay: 4.8, r: [24, 46], duration: 8.2 },
            ].map((pulse, i) => (
              <motion.circle
                key={`pulse-${i}`}
                cx="50"
                cy="50"
                fill="none"
                stroke="#FF8C2B"
                strokeWidth="0.85"
                initial={false}
                animate={
                  animate
                    ? {
                        r: pulse.r,
                        opacity: [0, 0.22, 0],
                      }
                    : { r: pulse.r[0], opacity: 0 }
                }
                transition={
                  animate
                    ? {
                        duration: pulse.duration,
                        repeat: Infinity,
                        repeatDelay: 2.4,
                        ease: "easeOut",
                        delay: pulse.delay,
                      }
                    : { duration: 0.8, ease: "easeOut" }
                }
              />
            ))}
          </svg>

          <motion.div
            className="absolute inset-0 grid place-items-center"
            initial={false}
            animate={animate ? { scale: [1, 1.012, 1] } : { scale: 1 }}
            transition={
              animate
                ? {
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }
                : { duration: 1.1, ease: "easeOut" }
            }
          >
            {/* Mark stays still — orbit lives in the field around it */}
            <EventHorizonMark
              size="lg"
              decorative
              animate={false}
              className="size-12 sm:size-14"
            />
          </motion.div>
        </div>

        <p className="mt-4 font-display text-[1.35rem] font-semibold tracking-tight text-[#F8FAFC] sm:text-[1.5rem]">
          Event Horizon
        </p>
        <p className="mt-1.5 max-w-[16rem] text-[0.7rem] font-medium leading-snug text-[#FFC27A]/80 sm:text-xs">
          Event discovery & reservations
        </p>
      </div>
    </div>
  );
}
