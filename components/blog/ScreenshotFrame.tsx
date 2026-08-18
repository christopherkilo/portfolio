"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ImageIcon } from "lucide-react";
import Image from "next/image";

function isPlaceholderSrc(src: string): boolean {
  return src.startsWith("placeholder:") || src.startsWith("generated:");
}

function placeholderLabel(src: string, alt: string): string {
  const file = src.replace(/^placeholder:|^generated:/, "");
  return alt || file || "Screenshot to be added";
}

export function ScreenshotFrame({
  src = "",
  alt = "",
  caption,
}: {
  src?: string;
  alt?: string;
  caption?: string;
}) {
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const placeholder = !src || isPlaceholderSrc(src) || failed;
  const captionText = caption ?? (alt || undefined);
  const expandable = !placeholder;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  return (
    <>
      <figure className="my-8">
        {placeholder ? (
          <div
            className="blog-shot grid min-h-[14rem] place-items-center rounded-2xl border border-white/10 bg-black/45 px-6 py-10 text-center backdrop-blur-xl sm:min-h-[18rem]"
            role="img"
            aria-label={`${placeholderLabel(src, alt)}. Screenshot to be added.`}
          >
            <div>
              <ImageIcon className="mx-auto size-7 text-muted" aria-hidden />
              <p className="mt-3 font-display text-sm font-semibold tracking-wide text-text">
                Screenshot to be added
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-secondary">
                {placeholderLabel(src, alt)}
              </p>
              {src.startsWith("placeholder:") ? (
                <p className="mt-3 font-mono text-[11px] text-muted">
                  {src.replace(/^placeholder:/, "/images/blog/")}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="blog-shot group block w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 text-left backdrop-blur-xl transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Expand image: ${alt || "article screenshot"}`}
          >
            {/* Native img keeps markdown paths simple and avoids broken next/image refs */}
            <div className="relative aspect-[16/10] w-full bg-black/30">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, 736px"
                className="object-cover"
                onError={() => setFailed(true)}
              />
            </div>
          </button>
        )}
        {captionText ? (
          <figcaption className="mt-3 text-center text-sm leading-relaxed text-muted">
            {captionText}
          </figcaption>
        ) : null}
      </figure>

      <AnimatePresence>
        {open && expandable ? (
          <motion.div
            className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reducedMotion ? 1 : 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0B0B12] p-3 sm:p-4"
              onClick={(event) => event.stopPropagation()}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: 8 }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3
                  id={titleId}
                  className="font-display text-base font-semibold text-text sm:text-lg"
                >
                  {alt || "Screenshot"}
                </h3>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-text transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Close image"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-black/30">
                <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
