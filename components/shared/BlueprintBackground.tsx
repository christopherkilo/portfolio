"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

export function BlueprintBackground() {
  const reducedMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 50, y: 40 });

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: (i * 37) % 100,
        y: (i * 53) % 100,
        size: 1.5 + (i % 3),
        duration: 14 + (i % 7),
        delay: i * 0.4,
      })),
    [],
  );

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      setPointer({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-bg" />
      <div className="blueprint-grid absolute inset-0 opacity-60" />

      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="trace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M40 120 H220 L280 180 H520 L580 120 H820"
          stroke="url(#trace)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M100 420 H340 L390 470 H640 L700 410 H980"
          stroke="url(#trace)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M60 680 H300 L360 620 H700 L760 680 H1100"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="1"
          fill="none"
        />
        {[
          [220, 120],
          [280, 180],
          [580, 120],
          [390, 470],
          [700, 410],
          [360, 620],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="2.5"
            fill="#06B6D4"
            opacity="0.55"
          />
        ))}
      </svg>

      <motion.div
        className="absolute size-[42rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--glow-primary), transparent 70%)",
          left: `${pointer.x}%`,
          top: `${pointer.y}%`,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={
          reducedMotion
            ? undefined
            : { opacity: [0.18, 0.28, 0.18] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute -right-24 top-24 size-[28rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--glow-secondary), transparent 70%)",
        }}
        animate={
          reducedMotion
            ? { opacity: 0.15 }
            : { opacity: [0.12, 0.22, 0.12], y: [0, 18, 0] }
        }
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {!reducedMotion
        ? particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute rounded-full bg-secondary/50"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
              }}
              animate={{
                y: [0, -24, 0],
                opacity: [0.15, 0.55, 0.15],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))
        : null}
    </div>
  );
}
