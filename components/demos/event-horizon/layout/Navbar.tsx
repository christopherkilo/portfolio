"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS, SITE } from "@/lib/demos/event-horizon/constants";
import { cn } from "@/lib/demos/event-horizon/utils";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { ThemeToggle } from "@/components/demos/event-horizon/ui/ThemeToggle";
import { useFavorites } from "@/contexts/demos/event-horizon/FavoritesContext";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { favorites, ready } = useFavorites();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 h-[var(--nav-height)] border-b transition-colors",
          scrolled
            ? "border-border bg-bg/85 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/demos/event-horizon" className="font-display text-lg font-bold tracking-tight">
            <span className="text-accent">Event</span> Horizon
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/demos/event-horizon"
                  ? pathname === "/demos/event-horizon"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-muted hover:bg-surface-elevated hover:text-ink",
                  )}
                >
                  {link.label}
                  {link.href === "/demos/event-horizon/favorites" && ready && favorites.length > 0 ? (
                    <span className="ml-1.5 rounded-full bg-warm/20 px-1.5 py-0.5 text-[10px] text-warm">
                      {favorites.length}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button href="/demos/event-horizon/browse" size="sm" className="hidden sm:inline-flex">
              Explore events
            </Button>
            <ThemeToggle className="hidden md:inline-flex" />
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border md:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-overlay backdrop-blur-sm"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <motion.nav
              aria-label="Mobile"
              className="absolute inset-x-3 top-[calc(var(--nav-height)+0.5rem)] rounded-2xl border border-border bg-surface p-4"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted">{SITE.name}</p>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border"
                >
                  <X className="size-4" />
                </button>
              </div>
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium hover:bg-surface-elevated"
                    >
                      {link.href === "/demos/event-horizon/favorites" ? (
                        <Heart className="size-4 text-warm" aria-hidden />
                      ) : null}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-border pt-3">
                <ThemeToggle showLabel />
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
