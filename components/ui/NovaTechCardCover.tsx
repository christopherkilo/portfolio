"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { NovaTechMark } from "@/components/demos/novatech/brand/NovaTechMark";
import { cn } from "@/lib/utils";

type NovaTechCardCoverProps = {
  className?: string;
  reducedMotion?: boolean | null;
  /** Cover motion plays only while hovered / focused. */
  active?: boolean;
};

/**
 * Portfolio cover for NovaTech — partnership convergence + enterprise scan,
 * deliberately unlike TaskFlow's workflow pipeline.
 */
export function NovaTechCardCover({
  className,
  reducedMotion: reducedMotionProp,
  active = false,
}: NovaTechCardCoverProps) {
  const uid = useId().replace(/:/g, "");
  const reducedHook = useReducedMotion();
  const reduced = reducedMotionProp ?? reducedHook;
  const animate = active && !reduced;

  const arcId = `nt-cover-arc-${uid}`;
  const sweepId = `nt-cover-sweep-${uid}`;

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-[#0B0F1A]",
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute -right-10 top-[-20%] size-72 rounded-full bg-[#6366F1]/[0.2] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-[-12%] size-80 rounded-full bg-[#4338CA]/[0.14] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_35%,rgba(99,102,241,0.14),transparent_50%)]" />

      {/* Soft enterprise grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(165,180,252,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(165,180,252,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)",
        }}
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 400 250"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={arcId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#6366F1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#4338CA" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={sweepId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0" />
            <stop offset="45%" stopColor="#6366F1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Expanding rounded frames — mark geometry, not a pipeline */}
        {[38, 54, 72].map((r, i) => (
          <motion.rect
            key={`frame-${r}`}
            x={280 - r}
            y={78 - r * 0.55}
            width={r * 2}
            height={r * 1.15}
            rx="14"
            fill="none"
            stroke="#6366F1"
            strokeWidth="1"
            initial={false}
            animate={
              animate
                ? {
                    opacity: [0.08, 0.32, 0.08],
                    scale: [0.96, 1.04, 0.96],
                  }
                : { opacity: 0.12 + i * 0.04, scale: 1 }
            }
            style={{ transformOrigin: "280px 95px" }}
            transition={
              animate
                ? {
                    duration: 4.2 + i * 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.45,
                  }
                : { duration: 0.25 }
            }
          />
        ))}

        {/* Partnership arcs converging into a hub */}
        <path
          d="M48 188 C120 188 170 120 248 102"
          fill="none"
          stroke={`url(#${arcId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={animate ? "6 10" : undefined}
        >
          {animate ? (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-48"
              dur="6s"
              repeatCount="indefinite"
            />
          ) : null}
        </path>
        <path
          d="M52 210 C130 210 190 150 258 118"
          fill="none"
          stroke="#A5B4FC"
          strokeOpacity="0.28"
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeDasharray={animate ? "4 9" : undefined}
        >
          {animate ? (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="40"
              dur="8s"
              repeatCount="indefinite"
            />
          ) : null}
        </path>

        {/* Convergence hub */}
        <motion.circle
          cx="268"
          cy="108"
          r="5"
          fill="#A5B4FC"
          initial={false}
          animate={
            animate
              ? { opacity: [0.35, 0.9, 0.35], scale: [1, 1.15, 1] }
              : { opacity: 0.55, scale: 1 }
          }
          transition={
            animate
              ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.25 }
          }
        />
        <circle cx="268" cy="108" r="2.2" fill="#FFFFFF" opacity="0.85" />

        {/* Vertical scan sweep — IT/ops feel */}
        {animate ? (
          <motion.rect
            x="210"
            width="120"
            height="250"
            fill={`url(#${sweepId})`}
            initial={{ y: -250, opacity: 0 }}
            animate={{ y: [-220, 250], opacity: [0, 0.55, 0] }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.45, 1],
            }}
          />
        ) : null}

        {/* Soft status pips (not traveling cards) */}
        {[
          [96, 186],
          [150, 150],
          [210, 122],
        ].map(([cx, cy], i) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="2.4"
            fill="#6366F1"
            initial={false}
            animate={
              animate
                ? { opacity: [0.2, 0.7, 0.2] }
                : { opacity: 0.35 }
            }
            transition={
              animate
                ? {
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.55,
                  }
                : { duration: 0.25 }
            }
          />
        ))}
      </svg>

      <div className="absolute inset-0 flex flex-col items-start justify-center px-[12%] pb-[6%] pt-[4%]">
        <motion.div
          initial={false}
          animate={animate ? { y: [0, -3, 0] } : { y: 0 }}
          transition={
            animate
              ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.25 }
          }
        >
          <NovaTechMark size="lg" decorative className="size-11 sm:size-12" />
        </motion.div>
        <p className="mt-5 font-display text-[1.35rem] font-semibold tracking-tight text-[#F8FAFC] sm:text-[1.5rem]">
          NovaTech Solutions
        </p>
        <p className="mt-1.5 max-w-[16rem] text-[0.7rem] font-medium leading-snug text-[#A5B4FC]/85 sm:text-xs">
          MSP site & lead capture
        </p>
      </div>
    </div>
  );
}
