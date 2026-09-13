"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type CaseStudySection = { id: string; label: string };

export function useActiveSection(sections: readonly CaseStudySection[]) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const nodes = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  return activeSection;
}

export function CaseStudyProgress({ accent }: { accent: string }) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left"
      style={{ scaleX: progress, backgroundColor: accent }}
    />
  );
}

export function CaseStudyDesktopNav({
  sections,
  activeSection,
  accent,
}: {
  sections: readonly CaseStudySection[];
  activeSection: string;
  accent: string;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 xl:block">
      <nav
        aria-label="Case study sections"
        className="pointer-events-auto max-h-[70vh] space-y-1 overflow-y-auto rounded-2xl border border-white/8 bg-black/55 p-3 backdrop-blur-xl"
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={cn(
              "block min-h-9 rounded-lg px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              activeSection === section.id
                ? "bg-white/10"
                : "text-secondary hover:text-text",
            )}
            style={
              activeSection === section.id
                ? { color: accent, outlineColor: accent }
                : { outlineColor: accent }
            }
          >
            {section.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function CaseStudyMobileToc({
  sections,
  activeSection,
  accent,
}: {
  sections: readonly CaseStudySection[];
  activeSection: string;
  accent: string;
}) {
  return (
    <div className="sticky top-[var(--nav-height)] z-30 -mx-4 border-b border-white/8 bg-bg/90 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:hidden">
      <label className="sr-only" htmlFor="case-study-mobile-toc">
        Jump to section
      </label>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              activeSection === section.id
                ? "border-transparent text-bg"
                : "border-white/10 text-secondary hover:text-text",
            )}
            style={
              activeSection === section.id
                ? { backgroundColor: accent, outlineColor: accent }
                : { outlineColor: accent }
            }
          >
            {section.label}
          </a>
        ))}
      </div>
      <select
        id="case-study-mobile-toc"
        className="sr-only"
        value={activeSection}
        onChange={(event) => {
          const target = document.getElementById(event.target.value);
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CaseStudyScrollCue({
  href,
  reducedMotion,
  className,
}: {
  href: string;
  reducedMotion?: boolean | null;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex flex-col items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      Scroll
      <ChevronDown
        className={cn("size-4", !reducedMotion && "animate-bounce")}
      />
    </a>
  );
}

export function CaseStudyLightbox({
  open,
  title,
  onClose,
  accent,
  children,
  wide = false,
  onPrev,
  onNext,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  accent: string;
  children: React.ReactNode;
  wide?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const titleId = useId();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        onPrev?.();
        return;
      }
      if (event.key === "ArrowRight") {
        onNext?.();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = document.getElementById(`case-study-lightbox-${titleId}`);
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose, onPrev, onNext, titleId]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          id={`case-study-lightbox-${titleId}`}
          onClick={onClose}
        >
          <motion.div
            className={cn(
              "relative w-full rounded-3xl border border-white/10 bg-[#0B0B12] p-5",
              wide ? "max-w-6xl" : "max-w-3xl",
            )}
            onClick={(event) => event.stopPropagation()}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            onTouchStart={(event) => {
              touchStartX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchStartX.current == null) return;
              const dx =
                (event.changedTouches[0]?.clientX ?? touchStartX.current) -
                touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(dx) < 48) return;
              if (dx < 0) onNext?.();
              else onPrev?.();
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 id={titleId} className="font-display text-2xl font-semibold">
                {title}
              </h3>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 p-2 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: accent }}
                aria-label="Close preview"
              >
                <X className="size-5" />
              </button>
            </div>
            {children}
            {onPrev || onNext ? (
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onPrev}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ outlineColor: accent }}
                  aria-label="Previous image"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ outlineColor: accent }}
                  aria-label="Next image"
                >
                  Next
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function CaseStudyFooterNav({
  prev,
  next,
  seriesLabel,
  accent,
}: {
  prev?: { href: string; label: string };
  next: { href: string; label: string };
  seriesLabel?: string;
  accent: string;
}) {
  return (
    <footer className="flex flex-col gap-4 border-t border-white/8 pt-10">
      {seriesLabel ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {seriesLabel}
        </p>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <Button href="/projects" variant="outline">
            <ArrowLeft className="size-4" />
            All projects
          </Button>
          {prev ? (
            <Button href={prev.href} variant="outline">
              <ArrowLeft className="size-4" />
              {prev.label}
            </Button>
          ) : null}
        </div>
        <Link
          href={next.href}
          className="group inline-flex items-center gap-3 text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: accent }}
        >
          <span>
            <span className="block text-xs uppercase tracking-[0.18em] text-muted">
              Next project
            </span>
            <span
              className="font-display text-xl font-semibold transition group-hover:opacity-90"
              style={{ color: "inherit" }}
            >
              <span className="transition group-hover:brightness-125" style={{ color: accent }}>
                {next.label}
              </span>
            </span>
          </span>
          <ArrowRight className="size-5 transition group-hover:translate-x-1" style={{ color: accent }} />
        </Link>
      </div>
    </footer>
  );
}
