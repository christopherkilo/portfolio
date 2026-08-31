"use client";

import { useEffect, useRef, type RefObject } from "react";
import { focusFirstElement, handleFocusTrapTab } from "@/lib/focusTrap";

type UseDialogFocusOptions = {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
};

/**
 * Focus trap + Escape + body scroll lock + restore focus on close.
 * Used by the mobile menu, command palette, and screenshot lightbox.
 */
export function useDialogFocus({
  open,
  containerRef,
  initialFocusRef,
  onClose,
}: UseDialogFocusOptions) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      focusFirstElement(container);
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      const container = containerRef.current;
      if (container) handleFocusTrapTab(event, container);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [open, containerRef, initialFocusRef]);
}
