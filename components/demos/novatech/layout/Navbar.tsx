"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { CTA, DEMO_BASE, NAV_LINKS } from "@/lib/demos/novatech/constants";
import { contactHref, isNavActive } from "@/lib/demos/novatech/paths";
import { cn } from "@/lib/demos/novatech/utils";
import { Button } from "@/components/demos/novatech/ui/Button";
import { MobileMenu } from "@/components/demos/novatech/layout/MobileMenu";
import { ThemeToggle } from "@/components/demos/novatech/layout/ThemeToggle";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 h-[var(--nav-height)] border-b transition-colors duration-300",
          scrolled
            ? "border-border bg-surface/90 backdrop-blur-xl shadow-sm"
            : "border-transparent bg-surface/70 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href={DEMO_BASE}
            className="flex min-w-0 items-center gap-2 font-display text-lg font-bold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg gradient-band text-xs font-bold tracking-tight text-band-ink shadow-sm"
              aria-hidden="true"
            >
              NT
            </span>
            <span className="truncate">
              <span className="text-primary">Nova</span>Tech
              <span className="ml-1 font-medium text-muted">Solutions</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active = isNavActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-bg hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <Button href={contactHref()} size="sm">
                {CTA.primary}
              </Button>
            </div>
            <ThemeToggle />
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu
        open={open}
        onClose={closeMenu}
        returnFocusRef={menuButtonRef}
      />
    </>
  );
}
