"use client";

import { useEffect, useRef, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, SITE } from "@/lib/demos/novatech/constants";
import { cn } from "@/lib/demos/novatech/utils";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export function MobileMenu({ open, onClose, returnFocusRef }: MobileMenuProps) {
  const reducedMotion = useReducedMotion();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocusTarget = returnFocusRef.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      returnFocusTarget?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            aria-label="Close menu"
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            className="absolute inset-x-3 top-[calc(var(--nav-height)+0.5rem)] rounded-2xl border border-border bg-surface p-4 shadow-xl"
            initial={reducedMotion ? false : { y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reducedMotion ? undefined : { y: -10, opacity: 0 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p
                id="mobile-navigation-title"
                className="text-sm font-medium text-muted"
              >
                {SITE.name} navigation
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav aria-label="Mobile">
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => {
                  const active =
                    link.href === "/demos/novatech-solutions"
                      ? pathname === "/demos/novatech-solutions"
                      : pathname.startsWith(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-lg px-3 py-3 text-base font-medium transition",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-ink hover:bg-bg",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
