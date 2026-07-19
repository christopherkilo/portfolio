"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CarouselProps = {
  children: ReactNode[];
  className?: string;
  label: string;
  autoPlayMs?: number;
};

export function Carousel({
  children,
  className,
  label,
  autoPlayMs = 4200,
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [itemWidth, setItemWidth] = useState(340);
  const x = useMotionValue(0);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);

  const count = children.length;
  const gap = 24;

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.querySelector<HTMLElement>("[data-carousel-item]");
    if (first) {
      setItemWidth(first.offsetWidth + gap);
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, children]);

  const clampIndex = useCallback(
    (value: number) => {
      if (count <= 1) return 0;
      return ((value % count) + count) % count;
    },
    [count],
  );

  const scrollToIndex = useCallback(
    (next: number, withMomentum = false) => {
      const target = clampIndex(next);
      setIndex(target);
      const destination = -target * itemWidth;
      if (reducedMotion) {
        x.set(destination);
        return;
      }
      animate(x, destination, {
        type: withMomentum ? "spring" : "tween",
        stiffness: 220,
        damping: 28,
        duration: withMomentum ? undefined : 0.45,
        ease: [0.22, 1, 0.36, 1],
      });
    },
    [clampIndex, itemWidth, reducedMotion, x],
  );

  useEffect(() => {
    if (reducedMotion || paused || isDragging || count <= 1) return;
    const id = window.setInterval(() => {
      scrollToIndex(index + 1);
    }, autoPlayMs);
    return () => window.clearInterval(id);
  }, [
    autoPlayMs,
    count,
    index,
    isDragging,
    paused,
    reducedMotion,
    scrollToIndex,
  ]);

  function onPointerDown(e: React.PointerEvent) {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    scrollStart.current = x.get();
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocity.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX.current;
    const dt = Math.max(now - lastTime.current, 1);
    velocity.current = dx / dt;
    lastX.current = e.clientX;
    lastTime.current = now;
    x.set(scrollStart.current + (e.clientX - dragStartX.current));
  }

  function onPointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    const current = x.get();
    const projected = current + velocity.current * 180;
    const rawIndex = Math.round(-projected / itemWidth);
    scrollToIndex(rawIndex, true);
  }

  const progress = count > 0 ? ((index + 1) / count) * 100 : 0;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div
          className="h-1 flex-1 overflow-hidden rounded-full bg-white/5"
          aria-hidden
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={`Previous ${label}`}
            onClick={() => scrollToIndex(index - 1)}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-text transition hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            onClick={() => scrollToIndex(index + 1)}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-text transition hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <motion.div
          ref={trackRef}
          className="flex cursor-grab touch-pan-y active:cursor-grabbing"
          style={{ x, gap }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {children.map((child, i) => (
            <div
              key={i}
              data-carousel-item
              className="shrink-0"
              aria-hidden={i !== index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              {child}
            </div>
          ))}
        </motion.div>
      </div>

      <p className="sr-only" aria-live="polite">
        Slide {index + 1} of {count}
      </p>
    </div>
  );
}
