"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Ticket, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { NAV_LINKS, SITE } from "@/lib/demos/event-horizon/constants";
import {
  focusFirstElement,
  handleFocusTrapTab,
} from "@/lib/demos/event-horizon/focusTrap";
import { cn } from "@/lib/demos/event-horizon/utils";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { ThemeToggle } from "@/components/demos/event-horizon/ui/ThemeToggle";
import { ProfileMenu } from "@/components/demos/event-horizon/auth/ProfileMenu";
import { useFavorites } from "@/contexts/demos/event-horizon/FavoritesContext";
import { useReservations } from "@/contexts/demos/event-horizon/ReservationsContext";
import { useAuthModal } from "@/contexts/demos/event-horizon/AuthModalContext";

const MOBILE_MENU_ID = "event-horizon-mobile-menu";

function isProtectedNavHref(href: string) {
  return (
    href === "/demos/event-horizon/favorites" ||
    href === "/demos/event-horizon/tickets"
  );
}

function NavbarInner() {
  const pathname = usePathname();
  const { status: authStatus } = useSession();
  const { openSignIn } = useAuthModal();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { favorites, ready } = useFavorites();
  const { reservations, ready: ticketsReady } = useReservations();
  const upcomingCount = useMemo(
    () =>
      reservations.filter((reservation) => reservation.status === "Upcoming")
        .length,
    [reservations],
  );
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    window.requestAnimationFrame(() => {
      if (panel) focusFirstElement(panel);
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (panel) handleFocusTrapTab(event, panel);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      menuButton?.focus();
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function handleProtectedNav(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (authStatus === "authenticated") return;
    if (!isProtectedNavHref(href)) return;
    event.preventDefault();
    closeMenu();
    openSignIn({ type: "navigate", href });
  }

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
          <Link
            href="/demos/event-horizon"
            className="rounded-sm font-display text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
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
                  aria-current={active ? "page" : undefined}
                  onClick={(event) => handleProtectedNav(event, link.href)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-muted hover:bg-surface-elevated hover:text-ink",
                  )}
                >
                  {link.label}
                  {link.href === "/demos/event-horizon/favorites" &&
                  ready &&
                  favorites.length > 0 ? (
                    <span className="ml-1.5 rounded-full bg-warm/20 px-1.5 py-0.5 text-[10px] text-warm">
                      {favorites.length}
                      <span className="sr-only"> saved</span>
                    </span>
                  ) : null}
                  {link.href === "/demos/event-horizon/tickets" &&
                  ticketsReady &&
                  upcomingCount > 0 ? (
                    <span className="ml-1.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
                      {upcomingCount}
                      <span className="sr-only"> upcoming</span>
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              href="/demos/event-horizon/browse"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Explore events
            </Button>
            {authStatus === "authenticated" ? (
              <ProfileMenu className="hidden md:block" />
            ) : authStatus === "unauthenticated" ? (
              <Button
                variant="outline"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => openSignIn(null)}
                aria-haspopup="dialog"
              >
                Sign In
              </Button>
            ) : (
              <span
                className="hidden h-9 w-20 animate-pulse rounded-xl bg-surface-elevated md:inline-flex"
                aria-hidden
              />
            )}
            <ThemeToggle className="hidden md:inline-flex" />
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls={MOBILE_MENU_ID}
              aria-haspopup="dialog"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? (
                <X className="size-5" aria-hidden />
              ) : (
                <Menu className="size-5" aria-hidden />
              )}
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
            <div
              className="absolute inset-0 bg-overlay backdrop-blur-sm"
              aria-hidden="true"
              onClick={closeMenu}
            />
            <motion.nav
              ref={panelRef}
              id={MOBILE_MENU_ID}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              tabIndex={-1}
              className="absolute inset-x-3 top-[calc(var(--nav-height)+0.5rem)] rounded-2xl border border-border bg-surface p-4 outline-none focus-visible:ring-2 focus-visible:ring-accent"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted" id={`${MOBILE_MENU_ID}-title`}>
                  {SITE.name}
                </p>
                <button
                  type="button"
                  data-autofocus
                  onClick={closeMenu}
                  aria-label="Close navigation"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <ul className="space-y-1" aria-labelledby={`${MOBILE_MENU_ID}-title`}>
                {NAV_LINKS.map((link) => {
                  const active =
                    link.href === "/demos/event-horizon"
                      ? pathname === "/demos/event-horizon"
                      : pathname.startsWith(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={(event) => {
                          handleProtectedNav(event, link.href);
                          if (
                            authStatus === "authenticated" ||
                            !isProtectedNavHref(link.href)
                          ) {
                            closeMenu();
                          }
                        }}
                        aria-current={active ? "page" : undefined}
                        className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {link.href === "/demos/event-horizon/favorites" ? (
                          <Heart className="size-4 text-warm" aria-hidden />
                        ) : null}
                        {link.href === "/demos/event-horizon/tickets" ? (
                          <Ticket className="size-4 text-accent" aria-hidden />
                        ) : null}
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 space-y-3 border-t border-border pt-3">
                {authStatus === "authenticated" ? (
                  <ProfileMenu className="w-full [&_button]:w-full [&_button]:max-w-none" />
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      closeMenu();
                      openSignIn(null);
                    }}
                  >
                    Sign In
                  </Button>
                )}
                <ThemeToggle showLabel />
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-[var(--nav-height)]" aria-hidden />}>
      <NavbarInner />
    </Suspense>
  );
}
