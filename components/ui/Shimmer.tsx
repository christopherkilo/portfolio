"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type ShimmerProps = {
  children: React.ReactNode;
  className?: string;
  /** Fire once when the element enters the viewport */
  onEnterView?: boolean;
  /** Also fire when pressed */
  onPress?: boolean;
};

/**
 * Signature electric-yellow shimmer.
 * Never loops. Triggers on hover, focus, optional press, optional enter-view.
 */
export function Shimmer({
  children,
  className,
  onEnterView = false,
  onPress = true,
}: ShimmerProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const timer = useRef<number | null>(null);

  function fire() {
    if (reducedMotion) return;
    if (timer.current) window.clearTimeout(timer.current);
    setActive(false);
    requestAnimationFrame(() => {
      setActive(true);
      timer.current = window.setTimeout(() => setActive(false), 650);
    });
  }

  useEffect(() => {
    if (!onEnterView || reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fire();
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEnterView, reducedMotion]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    <div
      ref={ref}
      className={cn("shimmer-host relative overflow-hidden", className)}
      onMouseEnter={fire}
      onFocusCapture={fire}
      onPointerDown={onPress ? fire : undefined}
    >
      {children}
      {!reducedMotion ? (
        <span
          aria-hidden
          className={cn("shimmer-beam", active && "shimmer-beam--active")}
        />
      ) : null}
    </div>
  );
}
