"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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
import {
  clampCarouselIndex,
  clampCarouselOffset,
  getCarouselAnnouncement,
  getCarouselDestination,
  getCarouselStride,
  getMaxCarouselIndex,
  getMaxCarouselOffset,
  getVisibleCarouselIndices,
} from "@/lib/carouselMetrics";
import { cn } from "@/lib/utils";

type CarouselProps = {
  children: ReactNode[];
  className?: string;
  label: string;
  autoPlayMs?: number;
};

const DRAG_THRESHOLD = 48;
const GAP = 24;

export function Carousel({
  children,
  className,
  label,
  autoPlayMs = 4200,
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [itemWidth, setItemWidth] = useState(340);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useMotionValue(0);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const didDrag = useRef(false);
  const activePointer = useRef<number | null>(null);
  const resumeTimer = useRef<number | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimer.current != null) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer]);

  const count = children.length;
  const stride = getCarouselStride(itemWidth, GAP);
  const maxOffset = getMaxCarouselOffset(trackWidth, viewportWidth);
  const maxIndex = getMaxCarouselIndex(maxOffset, stride);
  const clampedIndex = Math.min(index, maxIndex);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;
    const items = [
      ...track.querySelectorAll<HTMLElement>("[data-carousel-item]"),
    ];
    const first = items[0];
    if (first) {
      setItemWidth(first.offsetWidth);
    }
    const measuredTrack = items.reduce(
      (sum, el, i) => sum + el.offsetWidth + (i > 0 ? GAP : 0),
      0,
    );
    setTrackWidth(measuredTrack);
    setViewportWidth(viewport.clientWidth);
    const nextStride = getCarouselStride(
      first?.offsetWidth ?? itemWidth,
      GAP,
    );
    const nextMaxOffset = getMaxCarouselOffset(
      measuredTrack,
      viewport.clientWidth,
    );
    const nextMaxIndex = getMaxCarouselIndex(nextMaxOffset, nextStride);
    const nextIndex = Math.min(indexRef.current, nextMaxIndex);
    x.set(getCarouselDestination(nextIndex, nextStride, nextMaxOffset));
  }, [itemWidth, x]);

  useEffect(() => {
    measure();
    const viewport = viewportRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" && viewport
        ? new ResizeObserver(() => measure())
        : null;
    if (observer && viewport) observer.observe(viewport);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, children]);

  const scrollToIndex = useCallback(
    (next: number, withMomentum = false) => {
      const target = clampCarouselIndex(next, maxIndex);
      setIndex(target);
      const destination = getCarouselDestination(target, stride, maxOffset);
      if (reducedMotion || maxIndex <= 0) {
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
    [maxIndex, maxOffset, reducedMotion, stride, x],
  );

  useEffect(() => {
    if (reducedMotion || paused || isDragging || maxIndex <= 0) return;
    if (clampedIndex >= maxIndex) return;
    const id = window.setInterval(() => {
      scrollToIndex(clampedIndex + 1);
    }, autoPlayMs);
    return () => window.clearInterval(id);
  }, [
    autoPlayMs,
    clampedIndex,
    isDragging,
    maxIndex,
    paused,
    reducedMotion,
    scrollToIndex,
  ]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        "button, input, textarea, select, [data-no-drag], [role='button']",
      )
    ) {
      return;
    }
    activePointer.current = e.pointerId;
    didDrag.current = false;
    clearResumeTimer();
    setIsDragging(true);
    setPaused(true);
    dragStartX.current = e.clientX;
    scrollStart.current = x.get();
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocity.current = 0;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging || activePointer.current !== e.pointerId) return;

    const delta = e.clientX - dragStartX.current;
    if (!didDrag.current && Math.abs(delta) > DRAG_THRESHOLD) {
      didDrag.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    if (!didDrag.current) return;

    const now = performance.now();
    const dx = e.clientX - lastX.current;
    const dt = Math.max(now - lastTime.current, 1);
    velocity.current = dx / dt;
    lastX.current = e.clientX;
    lastTime.current = now;
    x.set(clampCarouselOffset(scrollStart.current + delta, maxOffset));
  }

  function onPointerUp(e: React.PointerEvent) {
    if (activePointer.current !== e.pointerId) return;
    activePointer.current = null;

    if (!isDragging) return;
    setIsDragging(false);

    if (didDrag.current) {
      const current = x.get();
      const projected = current + velocity.current * 180;
      const rawIndex = Math.round(-projected / stride);
      scrollToIndex(rawIndex, true);
    }

    clearResumeTimer();
    resumeTimer.current = window.setTimeout(() => {
      setPaused(false);
      resumeTimer.current = null;
    }, autoPlayMs);
  }

  function onClickCapture(e: React.MouseEvent) {
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      didDrag.current = false;
    }
  }

  const offset = getCarouselDestination(clampedIndex, stride, maxOffset);
  const visibleList = useMemo(
    () =>
      getVisibleCarouselIndices({
        count,
        itemWidth,
        gap: GAP,
        offset,
        viewportWidth: viewportWidth || itemWidth,
      }),
    [count, itemWidth, offset, viewportWidth],
  );
  const announcement = getCarouselAnnouncement(visibleList, count);
  const atStart = clampedIndex <= 0;
  const atEnd = clampedIndex >= maxIndex;

  const progress =
    maxIndex > 0 ? ((clampedIndex + 1) / (maxIndex + 1)) * 100 : 100;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => {
        clearResumeTimer();
        setPaused(true);
      }}
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
            className="h-full rounded-full bg-primary/90"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={`Previous ${label}`}
            disabled={atStart}
            onClick={() => scrollToIndex(clampedIndex - 1)}
            className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-text backdrop-blur-xl transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:text-text"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            disabled={atEnd}
            onClick={() => scrollToIndex(clampedIndex + 1)}
            className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-text backdrop-blur-xl transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:text-text"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div ref={viewportRef} className="overflow-hidden">
        <motion.div
          ref={trackRef}
          className="flex cursor-grab touch-pan-y active:cursor-grabbing"
          style={{ x, gap: GAP }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => {
            if (!isDragging) setPaused(false);
          }}
        >
          {children.map((child, i) => (
            <div
              key={i}
              data-carousel-item
              className="shrink-0"
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
        {announcement}
      </p>
    </div>
  );
}
