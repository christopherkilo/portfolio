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
  const [pointer, setPointer] = useState({ x: 50, y: 35 });

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: (i * 41) % 100,
        y: (i * 57) % 100,
        size: 1.2 + (i % 3) * 0.6,
        duration: 16 + (i % 8),
        delay: i * 0.45,
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
      <div className="blueprint-atmosphere absolute inset-0" />
      <div className="blueprint-grid absolute inset-0 opacity-50" />
      <div className="noise-overlay absolute inset-0" />

      <svg
        className="absolute inset-0 h-full w-full opacity-25"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="trace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
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
          stroke="rgba(255,255,255,0.1)"
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
            r="2"
            fill="#ffffff"
            opacity="0.25"
          />
        ))}
      </svg>

      <motion.div
        className="absolute size-[36rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.045), transparent 70%)",
          left: `${pointer.x}%`,
          top: `${pointer.y}%`,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={
          reducedMotion ? undefined : { opacity: [0.08, 0.16, 0.08] }
        }
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute -left-32 bottom-0 size-[30rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.035), transparent 70%)",
        }}
        animate={
          reducedMotion
            ? { opacity: 0.1 }
            : { opacity: [0.06, 0.12, 0.06], x: [0, 24, 0] }
        }
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {!reducedMotion
        ? particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute rounded-full bg-white/30"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
              }}
              animate={{
                y: [0, -18, 0],
                opacity: [0.08, 0.28, 0.08],
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
