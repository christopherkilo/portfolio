"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import {
  focusFirstElement,
  handleFocusTrapTab,
} from "@/lib/demos/event-horizon/focusTrap";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** When false, skip autofocus on the close control so a child can take focus. */
  autoFocusClose?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  autoFocusClose = true,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (dialogRef.current) {
        handleFocusTrapTab(event, dialogRef.current);
      }
    };

    document.addEventListener("keydown", onKey);
    window.requestAnimationFrame(() => {
      if (dialogRef.current) focusFirstElement(dialogRef.current);
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id={titleId} className="font-display text-lg font-semibold">
                {title}
              </h2>
              <button
                type="button"
                {...(autoFocusClose ? { "data-autofocus": true } : {})}
                onClick={onClose}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close dialog"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            {description ? (
              <p id={descriptionId} className="sr-only">
                {description}
              </p>
            ) : null}
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
