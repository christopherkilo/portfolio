"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TaskflowMark } from "@/components/demos/taskflow/brand/TaskflowMark";
import { cn } from "@/lib/utils";

type TaskflowCardCoverProps = {
  className?: string;
  /** When true, skip entrance / loop motion (parent already handles reduced motion). */
  reducedMotion?: boolean | null;
  /** Cover motion plays only while hovered / focused. */
  active?: boolean;
};

/**
 * Portfolio cover for TaskFlow — smaller mark, breathing space, soft workflow motion.
 */
export function TaskflowCardCover({
  className,
  reducedMotion: reducedMotionProp,
  active = false,
}: TaskflowCardCoverProps) {
  const uid = useId().replace(/:/g, "");
  const reducedHook = useReducedMotion();
  const reduced = reducedMotionProp ?? reducedHook;
  const animate = active && !reduced;

  const dashId = `tf-cover-dash-${uid}`;

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-[#09090B]",
        className,
      )}
      aria-hidden
    >
      {/* Atmosphere */}
      <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[#10B981]/[0.14] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 size-72 rounded-full bg-[#6EE7B7]/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_35%,rgba(16,185,129,0.12),transparent_55%)]" />

      {/* Soft workflow constellation */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.55]"
        viewBox="0 0 400 250"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={dashId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#6EE7B7" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Pipeline lanes */}
        <path
          d="M28 188 C90 188 110 140 170 140 C230 140 250 92 372 92"
          fill="none"
          stroke={`url(#${dashId})`}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="4 7"
        >
          {animate ? (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-44"
              dur="7s"
              repeatCount="indefinite"
            />
          ) : null}
        </path>
        <path
          d="M40 210 C100 210 120 162 180 162 C240 162 265 118 360 118"
          fill="none"
          stroke="#10B981"
          strokeOpacity="0.18"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="3 8"
        >
          {animate ? (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-36"
              dur="9s"
              repeatCount="indefinite"
            />
          ) : null}
        </path>

        {/* Milestone nodes */}
        {[
          [52, 188],
          [120, 168],
          [170, 140],
          [230, 128],
          [290, 105],
          [340, 92],
        ].map(([cx, cy], i) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={i === 2 || i === 4 ? 3.2 : 2.2}
            fill={i % 2 === 0 ? "#10B981" : "#6EE7B7"}
            initial={false}
            animate={
              animate
                ? { opacity: [0.22, 0.55, 0.22] }
                : { opacity: 0.35 + (i % 3) * 0.08 }
            }
            transition={
              animate
                ? {
                    duration: 3.6 + i * 0.35,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.28,
                  }
                : { duration: 0.25 }
            }
          />
        ))}

        {/* Abstract kanban cards drifting along the flow */}
        {animate
          ? [
              { x: [48, 210], y: 176, delay: 0 },
              { x: [90, 280], y: 150, delay: 1.4 },
              { x: [140, 320], y: 122, delay: 2.6 },
            ].map((card, i) => (
              <motion.rect
                key={`card-${i}`}
                width="18"
                height="11"
                rx="2.5"
                fill="#10B981"
                fillOpacity="0.2"
                stroke="#6EE7B7"
                strokeOpacity="0.35"
                strokeWidth="0.75"
                initial={{ x: card.x[0], y: card.y, opacity: 0 }}
                animate={{
                  x: card.x,
                  opacity: [0, 0.7, 0.7, 0],
                }}
                transition={{
                  duration: 8.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: card.delay,
                  times: [0, 0.12, 0.82, 1],
                }}
              />
            ))
          : null}
      </svg>

      {/* Brand lockup — smaller mark, breathing room */}
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
          <TaskflowMark size="lg" decorative className="size-11 sm:size-12" />
        </motion.div>
        <p className="mt-5 font-display text-[1.35rem] font-semibold tracking-tight text-[#F8FAFC] sm:text-[1.5rem]">
          TaskFlow
        </p>
        <p className="mt-1.5 max-w-[16rem] text-[0.7rem] font-medium leading-snug text-[#86EFAC]/80 sm:text-xs">
          Collaborative project management
        </p>
      </div>
    </div>
  );
}
