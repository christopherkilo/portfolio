"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { KiloToolkitMark } from "@/components/ui/KiloToolkitMark";
import { cn } from "@/lib/utils";

type KiloToolkitCardCoverProps = {
  className?: string;
  reducedMotion?: boolean | null;
  /** Cover motion plays only while hovered / focused. */
  active?: boolean;
};

/**
 * Portfolio cover for Kilo Toolkit — diagnostic gauge, radar sweep, and
 * module health pips (system / memory / network). Distinct from the web-app covers.
 */
export function KiloToolkitCardCover({
  className,
  reducedMotion: reducedMotionProp,
  active = false,
}: KiloToolkitCardCoverProps) {
  const uid = useId().replace(/:/g, "");
  const reducedHook = useReducedMotion();
  const reduced = reducedMotionProp ?? reducedHook;
  const animate = active && !reduced;

  const gaugeId = `kt-cover-gauge-${uid}`;
  const sweepId = `kt-cover-sweep-${uid}`;

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-[#111827]",
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute -right-14 -top-16 size-64 rounded-full bg-[#3B82F6]/[0.16] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-12 size-72 rounded-full bg-[#60A5FA]/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_38%,rgba(59,130,246,0.14),transparent_52%)]" />

      {/* Soft diagnostic grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(147,197,253,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(147,197,253,0.4) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse at 75% 40%, black 18%, transparent 68%)",
        }}
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 400 250"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={gaugeId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={sweepId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0" />
            <stop offset="55%" stopColor="#3B82F6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Concentric diagnostic rings */}
        {[42, 58, 76].map((r, i) => (
          <motion.circle
            key={`ring-${r}`}
            cx="292"
            cy="108"
            r={r}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="1"
            strokeDasharray={i === 1 ? "3 7" : undefined}
            initial={false}
            animate={
              animate
                ? { opacity: [0.1, 0.34, 0.1], rotate: i % 2 === 0 ? 360 : -360 }
                : { opacity: 0.14 + i * 0.05, rotate: 0 }
            }
            style={{ transformOrigin: "292px 108px" }}
            transition={
              animate
                ? {
                    opacity: {
                      duration: 5.5 + i * 0.7,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4 + i * 0.35,
                    },
                    rotate: {
                      duration: 48 + i * 14,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 0.5,
                    },
                  }
                : { duration: 1.1, ease: "easeOut" }
            }
          />
        ))}

        {/* Radar sweep wedge */}
        {animate ? (
          <motion.g
            style={{ transformOrigin: "292px 108px" }}
            initial={{ rotate: -40, opacity: 0 }}
            animate={{ rotate: 320, opacity: [0, 0.55, 0] }}
            transition={{
              duration: 7.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8,
              repeatDelay: 1.2,
            }}
          >
            <path
              d="M292 108 L292 32 A76 76 0 0 1 348 70 Z"
              fill={`url(#${sweepId})`}
            />
          </motion.g>
        ) : null}

        {/* Gauge arc hint near the hub */}
        <path
          d="M258 128 A38 38 0 0 1 326 88"
          fill="none"
          stroke={`url(#${gaugeId})`}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <motion.path
          d="M292 108 L318 84"
          stroke="#93C5FD"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={false}
          animate={
            animate
              ? { rotate: [-18, 22, -18] }
              : { rotate: 0 }
          }
          style={{ transformOrigin: "292px 108px" }}
          transition={
            animate
              ? {
                  duration: 8.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6,
                }
              : { duration: 1, ease: "easeOut" }
          }
        />
        <circle cx="292" cy="108" r="2.4" fill="#FFFFFF" opacity="0.9" />

        {/* Module health pips — System / Memory / Network */}
        {[
          { x: 72, y: 168, label: true },
          { x: 128, y: 148, label: true },
          { x: 184, y: 128, label: true },
        ].map((pip, i) => (
          <g key={`pip-${i}`}>
            <motion.circle
              cx={pip.x}
              cy={pip.y}
              r="3"
              fill="#3B82F6"
              initial={false}
              animate={
                animate
                  ? { opacity: [0.25, 0.75, 0.25], scale: [1, 1.15, 1] }
                  : { opacity: 0.4, scale: 1 }
              }
              transition={
                animate
                  ? {
                      duration: 3.8 + i * 0.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.7 + i * 0.45,
                    }
                  : { duration: 0.9, ease: "easeOut" }
              }
            />
            {i < 2 ? (
              <path
                d={`M${pip.x + 6} ${pip.y - 2} L${[128, 184][i] - 6} ${[148, 128][i] + 2}`}
                fill="none"
                stroke="#3B82F6"
                strokeOpacity="0.22"
                strokeWidth="1"
                strokeDasharray="3 5"
              />
            ) : null}
          </g>
        ))}
      </svg>

      <div className="absolute inset-0 flex flex-col items-start justify-center px-[12%] pb-[6%] pt-[4%]">
        <motion.div
          initial={false}
          animate={animate ? { y: [0, -2, 0] } : { y: 0 }}
          transition={
            animate
              ? {
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4,
                }
              : { duration: 1, ease: "easeOut" }
          }
        >
          <KiloToolkitMark size="lg" decorative className="size-11 sm:size-12" />
        </motion.div>
        <p className="mt-5 font-display text-[1.35rem] font-semibold tracking-tight text-[#F9FAFB] sm:text-[1.5rem]">
          Kilo Toolkit
        </p>
        <p className="mt-1.5 max-w-[16rem] text-[0.7rem] font-medium leading-snug text-[#93C5FD]/85 sm:text-xs">
          Diagnostics · System · Network
        </p>
      </div>
    </div>
  );
}
